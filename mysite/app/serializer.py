from rest_framework import serializers
from .models import PCIRequirement, PCITestingProcedure, client_data, pci_assess_data

class RequirementSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCIRequirement
        fields = '__all__'


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = client_data
        fields = ["client_id", "client_name"]


class PCIAssessDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = pci_assess_data
        fields = [
            "id",
            "requirement",
            "client",
            "procedure_id",
            "scope",
            "applicable_yn",
            "doc_ref_name",
            "doc_ref_file",
            "evidence_ref_name",
            "evidence_ref_file",
            "client_comments",
            "qsa_remarks",
        ]


class ProcedureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PCITestingProcedure
        fields = [
            "id",
            "procedure_id",
            "procedure_text",
            "reporting_instruction",
        ]


class ProcedureWithClientDataSerializer(serializers.Serializer):
    procedure = ProcedureSerializer()
    client_input = PCIAssessDataSerializer(allow_null=True)


class RequirementWithClientDataSerializer(serializers.Serializer):
    requirement_id = serializers.CharField()
    requirement_text = serializers.CharField()
    procedures = ProcedureWithClientDataSerializer(many=True)


class ClientPCIDataResponseSerializer(serializers.Serializer):
    client = ClientSerializer()
    requirements = RequirementWithClientDataSerializer(many=True)
