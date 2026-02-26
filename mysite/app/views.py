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
from .models import PCITestingProcedure
from django.contrib.auth.decorators import login_required
from django.conf import settings
ms_identity_web = settings.MS_IDENTITY_WEB
# Create your views here.



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
    procedure = get_object_or_404(PCITestingProcedure, id=pid)

    if request.method == "POST":
        procedure.scope = request.POST.get("scope")
        procedure.applicable_yn = request.POST.get("applicable_yn")

        procedure.doc_ref_name = request.POST.get("doc_ref_name", "")
        if request.FILES.get("doc_ref_file"):
            procedure.doc_ref_file = request.FILES["doc_ref_file"]

        procedure.evidence_ref_name = request.POST.get("evidence_ref_name", "")
        if request.FILES.get("evidence_ref_file"):
            procedure.evidence_ref_file = request.FILES["evidence_ref_file"]

        procedure.client_comments = request.POST.get("client_comments", "")
        procedure.qsa_remarks = request.POST.get("qsa_remarks", "")

        procedure.save()

    return redirect(f"/?rid={procedure.requirement_id}")

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

    return render(request, "app/home_1.html", {
    "sidebar_items": sidebar_items,
    "selected": selected,
    "procedures": procedures,
})


@ms_identity_web.login_required
def panel(request, rid):
    selected = get_object_or_404(PCIRequirement, requirement_id=rid)
    procedures = list(selected.procedures.all())

    html = render(request, "app/panel.html", {
        "selected": selected,
        "procedures": procedures,
    }).content.decode("utf-8")

    return JsonResponse({"html": html})




def index(request):
    return render(request, "app/index.html")

# def test_home(request):
#     return render(request, "app/home_1.html")

# def about(request):
#     return render(request, "app/about.html")


# @require_http_methods(["GET"])
# def api_requirements(request):
#     """API endpoint to fetch all main requirements grouped by requirement number"""
#     try:
#         # Get all requirements ordered by their number
#         all_reqs = PciRequirement.objects.all().order_by('test_requirements')
        
#         # Group by main requirement number (1, 2, 3, etc.)
#         main_requirements = {}
        
#         for req in all_reqs:
#             # Parse the requirement number from test_requirements field (e.g., "1.1.1" -> main_num=1)
#             try:
#                 req_num_str = str(req.test_requirements).strip()
#                 if not req_num_str:
#                     continue
                
#                 # Get the first digit(s) before the first dot
#                 parts = req_num_str.split('.')
#                 main_num = int(parts[0])
                
#                 # Initialize main requirement if not exists
#                 if main_num not in main_requirements:
#                     main_requirements[main_num] = {
#                         'id': f'req{main_num}',
#                         'number': str(main_num),
#                         'title': f'Requirement {main_num}',
#                         'subRequirementsCount': 0,
#                         'subRequirements': []
#                     }
                
#                 # Add this as a sub-requirement
#                 sub_req_data = {
#                     'id': f'subreq{req_num_str}',
#                     'number': str(req_num_str),
#                     'title': req.defined_approach_requirements[:80] if req.defined_approach_requirements else f'Requirement {req_num_str}',
#                     'description': req.defined_approach_requirements or '',
#                     'testingProcedure': req.defined_approach_testing_procedures or '',
#                     'customizedApproach': req.customized_approach or '',
#                     'testRequirements': req.test_requirements or ''
#                 }
#                 main_requirements[main_num]['subRequirements'].append(sub_req_data)
#                 main_requirements[main_num]['subRequirementsCount'] = len(main_requirements[main_num]['subRequirements'])
                
#             except (ValueError, IndexError) as e:
#                 print(f"Error parsing requirement {req.test_requirements}: {e}")
#                 continue
        
#         # Convert to list and sort by main requirement number
#         result = sorted(main_requirements.values(), key=lambda x: int(x['number']))
        
#         return JsonResponse(result, safe=False)
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return JsonResponse({'error': str(e)}, status=400)


# @require_http_methods(["GET"])
# def api_requirement_detail(request, requirement_id):
#     """API endpoint to fetch a specific requirement with all its sub-requirements"""
#     try:
#         # Extract the number from the requirement_id (e.g., 'req1' -> 1)
#         req_number = requirement_id.replace('req', '')
#         main_num = int(req_number)
        
#         # Get all sub-requirements for this main requirement
#         # Query by filtering the test_requirements field for entries starting with the main number
#         all_reqs = PciRequirement.objects.all().order_by('test_requirements')
        
#         sub_requirements_list = []
#         for req in all_reqs:
#             try:
#                 req_num_str = str(req.test_requirements).strip()
#                 if not req_num_str:
#                     continue
                
#                 # Check if this requirement belongs to the main requirement
#                 parts = req_num_str.split('.')
#                 if int(parts[0]) == main_num:
#                     sub_req_data = {
#                         'id': f'subreq{req_num_str}',
#                         'number': str(req_num_str),
#                         'title': req.defined_approach_requirements[:80] if req.defined_approach_requirements else f'Requirement {req_num_str}',
#                         'description': req.defined_approach_requirements or '',
#                         'testingProcedure': req.defined_approach_testing_procedures or '',
#                         'customizedApproach': req.customized_approach or '',
#                         'testRequirements': req.test_requirements or ''
#                     }
#                     sub_requirements_list.append(sub_req_data)
#             except (ValueError, IndexError):
#                 continue
        
#         if not sub_requirements_list:
#             return JsonResponse({'error': 'Requirement not found'}, status=404)
        
#         data = {
#             'id': f'req{main_num}',
#             'number': str(main_num),
#             'title': f'Requirement {main_num}',
#             'subRequirements': sub_requirements_list
#         }
        
#         return JsonResponse(data)
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         return JsonResponse({'error': str(e)}, status=400)