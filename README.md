<p align="center">
<img src="src/frontend/static/icons/Hipster_HeroLogoCyan.svg" width="300" alt="Online Boutique" />
</p>

**Online Boutique** is a cloud-native microservices demo application.
Online Boutique consists of a 10-tier microservices application. The application is a
web-based e-commerce app where users can browse items,
add them to the cart, and purchase them.

**Google uses this application to demonstrate use of technologies like
Kubernetes/GKE, Istio, Stackdriver, gRPC and OpenCensus**. This application
works on any Kubernetes cluster, as well as Google
Kubernetes Engine. It’s **easy to deploy with little to no configuration**.

Official Repo: https://github.com/GoogleCloudPlatform/microservices-demo/

## Dynatrace Modified Version
This is a modified version to showcase certain Istio functionality within Dynatrace. 

## Quickstart (Dynatrace)
0. **Prerequisistes**
Kubernetes cluster (incl. Dynatrace) up and runnning

1. **Deploy Hispter-Shop**
Clone this repository
```
kubectl apply -f dt/hipster-shop.yaml
```

2. **Istio-Usecases**
Depending on the use-case you want to trigger, apply the respective yaml file:
 - UC1: Circuit Breaker
 - UC2: Local Rate Limiting
 - UC3: Delay and Fault Injection
```
kubectl apply -f dt/isto/UC*.yaml
```
UC* -> replace with Use-Case yaml file in folder dt/istio