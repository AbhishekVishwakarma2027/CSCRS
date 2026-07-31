from inference.resolution_ai.similarity import SceneSimilarityEngine


class ResolutionAIEngine:

    def __init__(self):

        self.similarity = SceneSimilarityEngine()

    def predict(

        self,

        original_image: str,

        resolution_image: str,

    ):

        similarity = self.similarity.compare(

            original_image,

            resolution_image,

        )

        return {

            "scene_similarity": similarity,

            "same_scene": similarity >= 0.70,

        }