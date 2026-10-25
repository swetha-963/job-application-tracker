from rest_framework import serializers

from applications.models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        exclude = ("owner",)
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        current_min = self.instance.salary_min if self.instance else None
        current_max = self.instance.salary_max if self.instance else None
        salary_min = attrs.get("salary_min", current_min)
        salary_max = attrs.get("salary_max", current_max)

        if salary_min is not None and salary_max is not None and salary_min > salary_max:
            raise serializers.ValidationError({
                "salary_max": "Salary maximum must be greater than or equal to salary minimum."
            })

        return attrs
