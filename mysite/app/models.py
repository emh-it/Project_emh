from django.db import models

# Create your models here.
# class PciRequirement(models.Model):
#     requirements = models.IntegerField(primary_key=True)

#     test_requirements = models.CharField(
#         max_length=50,
#         db_column="Test requiremnts"
#     )

#     defined_approach_requirements = models.CharField(
#         max_length=1024,
#         db_column="Defined approach requirements"
#     )

#     customized_approach = models.CharField(
#         max_length=256,
#         db_column="Customized approach"
#     )

#     defined_approach_testing_procedures = models.CharField(
#         max_length=1024,
#         db_column="Defined approach testing procedures"
#     )

    # documents_url = models.CharField(
    #     max_length=512,
    #     db_column="Documents url",
    #     # null=True,
    #     blank=True
    # )

    # qsa_comments = models.TextField(
    #     db_column="QSA comments",
    #     # null=True,
    #     blank=True
    # )

    # additional_comments = models.TextField(
    #     db_column="Additional comments",
    #     # null=True,
    #     blank=True
    # )
    #  class Meta:
    #     managed = False                 # VERY IMPORTANT
    #     db_table = 'PCI_requirements'  # schema + table
    #     verbose_name = "PCI Requirement"

    # def __str__(self):
    #     return f"Requirement {self.requirements}"



#For test_home page
class PCIRequirement(models.Model):
    requirement_id = models.CharField(max_length=20, primary_key=True)
    requirement_text = models.TextField(blank=True, default="")

    class Meta:
        db_table = "pci_requirements"
        ordering = ["requirement_id"]

    def __str__(self):
        return self.requirement_id
    
class PCITestingProcedure(models.Model):
    id = models.BigAutoField(primary_key=True)
    requirement = models.ForeignKey(
        PCIRequirement,
        to_field="requirement_id",
        db_column="requirement_id",
        related_name="procedures",
        on_delete=models.CASCADE,
    )
    procedure_id = models.CharField(max_length=30)
    procedure_text = models.TextField(blank=True, default="")
    reporting_instruction = models.TextField(blank=True, default="")

    class Meta:
        db_table = "pci_testing_procedures"
        ordering = ["procedure_id"]

    def __str__(self):
        return self.procedure_id
