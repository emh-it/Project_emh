from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import PCIRequirement, PCITestingProcedure


class PCITestingProcedureInline(admin.TabularInline):
    model = PCITestingProcedure
    extra = 0
    fields = ("procedure_id", "procedure_text", "reporting_instruction")
    ordering = ("procedure_id",)


@admin.register(PCIRequirement)
class PCIRequirementAdmin(admin.ModelAdmin):
    list_display = ("requirement_id", "requirement_text")
    search_fields = ("requirement_id", "requirement_text")
    ordering = ("requirement_id",)
    inlines = [PCITestingProcedureInline]


@admin.register(PCITestingProcedure)
class PCITestingProcedureAdmin(admin.ModelAdmin):
    list_display = ("procedure_id", "requirement",)
    search_fields = ("procedure_id", "procedure_text")
    ordering = ("procedure_id",)

# from .models import PciRequirement

# @admin.register(PciRequirement)
# class PciRequirementAdmin(admin.ModelAdmin):
#     list_display = (
#         "requirements",
#         "test_requirements",
#         "defined_approach_requirements",
#         "customized_approach",
#         "defined_approach_testing_procedures",
#         # "documents_url",
#         # "qsa_comments",
#         # "additional_comments",
#     )

#     search_fields = (
#         "test_requirements",
#         "defined_approach_requirements",
#         "customized_approach",
#         # "documents_url",
#         # "qsa_comments",
#         # "additional_comments",
#     )

#     list_filter = (
#         "customized_approach",
#     )

#     ordering = ("requirements",)
