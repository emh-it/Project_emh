from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
import os
# Create your views here.

from django.views.decorators.http import require_POST
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
# from .models import PciRequirement
import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from .models import PCIRequirement
from django.utils import timezone
from .models import *
from django.contrib.auth.decorators import login_required
from django.conf import settings
from .models import client_data
ms_identity_web = settings.MS_IDENTITY_WEB
# Create your views here.



from rest_framework.views import APIView
from rest_framework.response import Response
from .models import PCIRequirement
from .serializer import (
    RequirementSerializer,
    ClientSerializer,
    ClientPCIDataResponseSerializer,
)


class TestAPIView(APIView):
    def get(self, request):
        requirements = PCIRequirement.objects.all()
        serializer = RequirementSerializer(requirements, many=True)
        return Response(serializer.data)


class ClientListAPIView(APIView):
    def get(self, request):
        clients = client_data.objects.all()
        serializer = ClientSerializer(clients, many=True)
        return Response(serializer.data)


class ClientPCIDataAPIView(APIView):
    def get(self, request, client_id):
        client = get_object_or_404(client_data, client_id=client_id)
        requirements = PCIRequirement.objects.all().prefetch_related("procedures")
        client_inputs = pci_assess_data.objects.filter(client=client)

        assess_map = {
            (entry.requirement_id, entry.procedure_id): entry
            for entry in client_inputs
        }

        requirement_payload = []
        for requirement in requirements:
            procedures_payload = []
            for procedure in requirement.procedures.all():
                procedures_payload.append({
                    "procedure": procedure,
                    "client_input": assess_map.get((requirement.requirement_id, procedure.procedure_id)),
                })

            requirement_payload.append({
                "requirement_id": requirement.requirement_id,
                "requirement_text": requirement.requirement_text,
                "procedures": procedures_payload,
            })

        response_payload = {
            "client": client,
            "requirements": requirement_payload,
        }
        serializer = ClientPCIDataResponseSerializer(response_payload, context={"request": request})
        return Response(serializer.data)


@require_POST
def delete_file(request, pid, field):
    procedure = get_object_or_404(PCITestingProcedure, id=pid)
    if field not in ["doc_ref_file", "evidence_ref_file"]:
        return JsonResponse({"error": "Invalid field"}, status=400)
    file_field = getattr(procedure, field)
    if file_field:
        # Remove file from storage
        file_path = file_field.path
        if os.path.isfile(file_path):
            os.remove(file_path)
        # Remove reference from model
        setattr(procedure, field, None)
        procedure.save()
    return redirect(request.META.get("HTTP_REFERER", "/"))


def save_procedure(request, pid):
    print("SAVE procedure called with PID:", pid)
    procedure = get_object_or_404(PCITestingProcedure, id=pid)
    # client_id = request.POST.get("client_id")  # Make sure this is passed in your form!
    client_id = 1  # For testing, replace with actual client ID retrieval logic
    # You may need to fetch the client object, e.g.:
    client = get_object_or_404(client_data, client_id=client_id)

    # Get or create the assessment record for this procedure, requirement, and client
    assess, created = pci_assess_data.objects.get_or_create(
        requirement=procedure.requirement,
        client=client,
        procedure_id=procedure.procedure_id,
        defaults={}
    )

    if request.method == "POST":
        assess.scope = request.POST.get("scope")
        assess.compliant_yn = request.POST.get("compliant_yn")

        assess.doc_ref_name = request.POST.get("doc_ref_name", "")
        if request.FILES.get("doc_ref_file"):
            assess.doc_ref_file = request.FILES["doc_ref_file"]

        assess.evidence_ref_name = request.POST.get("evidence_ref_name", "")
        if request.FILES.get("evidence_ref_file"):
            assess.evidence_ref_file = request.FILES["evidence_ref_file"]

        print("Client Comments: ", request.POST.get("client_comments", ""))
        assess.client_comments = request.POST.get("client_comments", "")
        assess.qsa_remarks = request.POST.get("qsa_remarks", "")
        try:
            print("WIthint eh sdsacen try block")
            assess.save()
        except Exception as e:
            print("Error saving assessment data:", e)

    return redirect(f"/?rid={procedure.requirement.requirement_id}")

def _depth(req_id: str) -> int:
    # "1.2" -> 2 parts => depth 2, "1.2.8" -> depth 3, etc.
    return len(req_id.split("."))

@ms_identity_web.login_required
def test(request):
    all_reqs = list(PCIRequirement.objects.all())

    # Build parent -> children mapping (only immediate children)
    req_map = {r.requirement_id: r for r in all_reqs}
    children_map = {r.requirement_id: [] for r in all_reqs}

    for r in all_reqs:
        parts = r.requirement_id.split(".")
        if len(parts) >= 2:
            parent_id = ".".join(parts[:-1])
            if parent_id in children_map:
                # only attach as "child" if it's exactly one level deeper
                if _depth(r.requirement_id) == _depth(parent_id) + 1:
                    children_map[parent_id].append(r)

    # Sort children naturally
    for pid in children_map:
        children_map[pid].sort(key=lambda x: [int(p) for p in x.requirement_id.split(".")])

    # Top-level list (no parent present in table)
    top_level = []
    for r in all_reqs:
        parts = r.requirement_id.split(".")
        parent_id = ".".join(parts[:-1])
        if len(parts) == 1 or parent_id not in req_map:
            top_level.append(r)

    top_level.sort(key=lambda x: [int(p) for p in x.requirement_id.split(".")])

    selected_id = request.GET.get("rid")
    if not selected_id and all_reqs:
        selected_id = top_level[0].requirement_id if top_level else all_reqs[0].requirement_id

    selected = get_object_or_404(PCIRequirement, requirement_id=selected_id) if selected_id else None
    procedures = list(selected.procedures.all()) if selected else []

    sidebar_items = []
    for parent in top_level:
        sidebar_items.append(("parent", parent))
        for child in children_map.get(parent.requirement_id, []):
            sidebar_items.append(("child", child))

    clients = client_data.objects.all()
    selected_client_id = request.GET.get("client_id") or ""

    return render(request, "app/home_1.html", {
        "sidebar_items": sidebar_items,
        "selected": selected,
        "procedures": procedures,
        "clients": clients,
        "selected_client_id": selected_client_id,
    })


@ms_identity_web.login_required
def panel(request, rid):
    selected = get_object_or_404(PCIRequirement, requirement_id=rid)
    procedures = list(selected.procedures.all())
    # client_id = request.GET.get('client_id')
    client_id  = 1 
    print("Client ID in panel view:", client_id)
    combined = []
    for proc in procedures:
        assess = None
        if client_id:
            print("Client_id true")
            assess = pci_assess_data.objects.filter(
                requirement=selected,
                client__client_id=client_id,
                procedure_id=proc.procedure_id
            ).first()
        combined.append({
            "procedure": proc,
            "assess": assess,
        })

    clients = client_data.objects.all()
    print(combined)
    selected_client_id = request.GET.get("client_id") or ""
    html = render(request, "app/panel.html", {
        "selected": selected,
        "procedures": combined,
        "clients": clients,
        "selected_client_id": selected_client_id,
    }).content.decode("utf-8")

    return JsonResponse({"html": html})
# def panel(request, rid):
#     selected = get_object_or_404(PCIRequirement, requirement_id=rid)
#     procedures = list(selected.procedures.all())

#     html = render(request, "app/panel.html", {
#         "selected": selected,
#         "procedures": procedures,
#     }).content.decode("utf-8")

#     return JsonResponse({"html": html})




def index(request):
    return render(request, "app/index.html")


@csrf_exempt  # Only use this if you have CSRF issues; otherwise, keep CSRF protection!
def save_procedure_bulk(request):
    print("request fields", request.POST)
    if request.method == "POST":
        # You may want to get client_id from session or a hidden field in your form
        client_id = request.POST.get("client_id") or 1  # Replace with actual logic
        client = get_object_or_404(client_data, client_id=client_id)

        # Get the requirement id from the form or request (hidden field or GET param)
        requirement_id = request.POST.get("requirement_id")
        print("requirement id in bulk save:", requirement_id)
        requirement = get_object_or_404(PCIRequirement, requirement_id=requirement_id)

        # Loop through all procedures for this requirement
        procedures = list(requirement.procedures.all())
        print("The procedures : ",procedures)
        for proc in procedures:
            # Use the procedure id to get the correct form fields
            id = str(proc.id)
            print(proc.procedure_id, "with ID", id)
            scope = request.POST.get(f"scope_{id}")
            compliant_yn = request.POST.get(f"compliant_yn_{id}")
            bau = request.POST.get(f"bau_{id}")
            client_comments = request.POST.get(f"client_comments_{id}", "")
            qsa_remarks = request.POST.get(f"qsa_remarks_{id}", "")

            doc_ref_file = request.FILES.get(f"doc_ref_file_{id}")
            evidence_ref_file = request.FILES.get(f"evidence_ref_file_{id}")

            # Get or create the assessment record for this procedure, requirement, and client
            assess, created = pci_assess_data.objects.get_or_create(
                requirement=requirement,
                client=client,
                procedure_id=proc.procedure_id,
                defaults={}
            )
            print("Assessment record for procedure_id",assess.procedure_id, "created:", created)
            assess.scope = scope
            assess.compliant_yn = compliant_yn
            assess.bau = bau
            assess.client_comments = client_comments
            assess.qsa_remarks = qsa_remarks

            if doc_ref_file:
                assess.doc_ref_file = doc_ref_file
            if evidence_ref_file:
                assess.evidence_ref_file = evidence_ref_file
            print("Asses data before saving" , assess)
            try:
                assess.save()
                print("Assess variable data", assess.client_comments, assess.qsa_remarks)
            except Exception as e:
                print(f"Error saving assessment data for procedure {id}: {e}")
        return redirect(request.META.get('HTTP_REFERER', request.path))
        # return redirect(f"/?rid={requirement_id}")