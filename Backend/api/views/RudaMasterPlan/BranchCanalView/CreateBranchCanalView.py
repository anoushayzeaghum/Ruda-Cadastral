from ...common_imports import *


class CreateBranchCanalView(viewsets.ViewSet):
    queryset = BranchCanal.objects.all()
    serializer_class = BranchCanalSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        data = request.data

        try:
            serializer = BranchCanalSerializer(data=data)
            serializer.is_valid(raise_exception=True)

            record = serializer.save()

            return ApiResponse(
                status=status.HTTP_201_CREATED,
                message="Branch Canal created successfully.",
                data=BranchCanalSerializer(record).data,
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