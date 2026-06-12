from ..common_imports import *

class CreateMasterPlanView(viewsets.ViewSet):
    queryset = MasterPlan.objects.all()
    serializer_class = MasterPlanSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data

        try:
            serializer = MasterPlanSerializer(data=data)
            serializer.is_valid(raise_exception=True)

            masterplan = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="MasterPlan created successfully.",
                data=MasterPlanSerializer(masterplan).data,
                http_status=status.HTTP_201_CREATED,
            ).create_response()

        except serializers.ValidationError as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Serializer error.",
                data=e.detail,
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()

        except Exception as e:
            return ApiResponse(
                status=status.HTTP_400_BAD_REQUEST,
                message="Exception error.",
                data=str(e),
                http_status=status.HTTP_400_BAD_REQUEST,
            ).create_response()