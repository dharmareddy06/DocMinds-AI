import math
from typing import List, Set

def precision_at_k(retrieved: List[str], ground_truth: Set[str], k: int) -> float:
    if k <= 0 or not retrieved:
        return 0.0
    top_k = retrieved[:k]
    relevant_retrieved = sum(1 for item in top_k if item in ground_truth)
    return relevant_retrieved / k

def recall_at_k(retrieved: List[str], ground_truth: Set[str], k: int) -> float:
    if not ground_truth:
        return 0.0
    top_k = retrieved[:k]
    relevant_retrieved = sum(1 for item in top_k if item in ground_truth)
    return relevant_retrieved / len(ground_truth)

def reciprocal_rank(retrieved: List[str], ground_truth: Set[str]) -> float:
    for idx, item in enumerate(retrieved, start=1):
        if item in ground_truth:
            return 1.0 / idx
    return 0.0

def ndcg_at_k(retrieved: List[str], ground_truth: Set[str], k: int) -> float:
    top_k = retrieved[:k]
    dcg = 0.0
    for idx, item in enumerate(top_k, start=1):
        rel = 1.0 if item in ground_truth else 0.0
        dcg += rel / math.log2(idx + 1)

    # Ideal DCG
    num_relevant = min(len(ground_truth), k)
    idcg = sum(1.0 / math.log2(i + 1) for i in range(1, num_relevant + 1))

    if idcg == 0.0:
        return 0.0
    return dcg / idcg
