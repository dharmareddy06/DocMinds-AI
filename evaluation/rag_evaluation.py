import json
import os
from typing import Dict, List, Any
from backend.app.database.session import SessionLocal, init_db
from backend.app.retrieval.hybrid_search import hybrid_retrieval_service
from evaluation.retrieval_metrics import precision_at_k, recall_at_k, reciprocal_rank, ndcg_at_k

def run_retrieval_benchmark():
    init_db()
    db = SessionLocal()

    benchmark_path = os.path.join(os.path.dirname(__file__), "datasets", "sample_benchmark.json")
    with open(benchmark_path, "r", encoding="utf-8") as f:
        benchmark_queries = json.load(f)

    modes = ["vector_only", "keyword_only", "hybrid", "hybrid_rerank"]
    results: Dict[str, Dict[str, float]] = {m: {"recall@3": 0.0, "precision@3": 0.0, "mrr": 0.0, "ndcg@3": 0.0} for m in modes}

    print("=================================================================")
    print("           DocMind AI - Retrieval Evaluation Benchmark           ")
    print("=================================================================\n")

    for mode in modes:
        recalls = []
        precisions = []
        mrrs = []
        ndcgs = []

        for item in benchmark_queries:
            q = item["question"]
            expected_keywords = set(k.lower() for k in item["ground_truth_keywords"])

            retrieved = hybrid_retrieval_service.retrieve(db, query=q, mode=mode, top_k=3)
            
            # Match is relevant if it contains at least one ground-truth keyword
            retrieved_ids = [str(r["chunk_id"]) for r in retrieved]
            relevant_ids = set()
            for r in retrieved:
                content_lower = r["content"].lower()
                if any(kw in content_lower for kw in expected_keywords):
                    relevant_ids.add(str(r["chunk_id"]))

            recalls.append(recall_at_k(retrieved_ids, relevant_ids, k=3))
            precisions.append(precision_at_k(retrieved_ids, relevant_ids, k=3))
            mrrs.append(reciprocal_rank(retrieved_ids, relevant_ids))
            ndcgs.append(ndcg_at_k(retrieved_ids, relevant_ids, k=3))

        n = max(len(benchmark_queries), 1)
        results[mode]["recall@3"] = sum(recalls) / n
        results[mode]["precision@3"] = sum(precisions) / n
        results[mode]["mrr"] = sum(mrrs) / n
        results[mode]["ndcg@3"] = sum(ndcgs) / n

    # Print Comparison Table
    print(f"{'Retrieval Strategy':<25} | {'Recall@3':<10} | {'Precision@3':<12} | {'MRR':<8} | {'NDCG@3':<8}")
    print("-" * 72)
    for mode, scores in results.items():
        print(f"{mode:<25} | {scores['recall@3']:<10.3f} | {scores['precision@3']:<12.3f} | {scores['mrr']:<8.3f} | {scores['ndcg@3']:<8.3f}")

    print("\nBenchmark completed successfully.")
    db.close()
    return results

if __name__ == "__main__":
    run_retrieval_benchmark()
