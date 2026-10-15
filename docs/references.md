# References

## Directly relevant
- Glean, *Jev and the return of the zero-shot classifier* (Sep 2026). JEV vs LLM vs fine-tuned on four
  internal tasks; routing was JEV's strongest result (more accurate than the LLM router, 8.1× median
  speedup). https://www.glean.com/blog/jev-zero-shot-classifier
- LangChain TypeSafe integration docs. https://docs.langchain.com/oss/python/integrations/providers/typesafe
- InfoQ, TypeSafe AI releases Jev. https://www.infoq.com/news/2026/10/typesafe-ai-jev-released/

## Dataset
- Casanueva et al., *Efficient Intent Detection with Dual Sentence Encoders* (2020). arXiv:2003.04807
- Banking77 data. https://github.com/PolyAI-LDN/task-specific-datasets

## Prior art: classifier-based routing
- aurelio-labs/semantic-router. https://github.com/aurelio-labs/semantic-router
- vLLM Semantic Router. https://github.com/vllm-project/semantic-router
- RouteLLM (LMSYS). https://github.com/lm-sys/RouteLLM
- NVIDIA LLM Router blueprint. https://github.com/NVIDIA-AI-Blueprints/llm-router
- Rasa DIET / Dialogflow intent → fulfillment: the classic "classifier picks the handler" pattern.

## Background
- Karpathy, *Software 2.0* (2017).
- Kraska et al., *The Case for Learned Index Structures* (2018). arXiv:1712.01208
- Sculley et al., *Hidden Technical Debt in Machine Learning Systems* (NeurIPS 2015).
