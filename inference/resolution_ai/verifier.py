from inference.resolution_ai.similarity import SceneSimilarityEngine


class ResolutionVerifier:

    def __init__(self):
        self.similarity_engine = SceneSimilarityEngine()

    def verify(
        self,
        original_image: str,
        resolution_image: str,
    ):

        similarity = self.similarity_engine.compare(
            original_image=original_image,
            resolution_image=resolution_image,
        )

        return {
            "scene_similarity": similarity,
            "same_scene": similarity >= 0.75,
        }