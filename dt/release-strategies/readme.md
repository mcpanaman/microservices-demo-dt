# Release Strategies

This folder contains 2 Kubernetes demo samples showcasing how a blue/green deployment and a canary deployment can be properly configured for observability purposes in Dynatrace. The goal is to get consistent and merged services within Dynatrace which allow you to analyse important service metrics (golden signals) by service version.

Prerequisites:
- K8s cluster up and running (e.g. GKE in a version supported by Dynatrace (Operator))
- Dynatrace Operator with AG and OneAgents rolled out in full-stack mode
- Istio (>=1.13) installed in this K8s cluster (e.g. default profile) 

## Blue/Green Deployment

Scenario:
Google's hipster-shop will be deployed in separate blue/green namespaces. After a new version has been tested, released and deployed, traffic will be shifted accordingly. For this purpose, the hipster-shop loadbalancer will be deployed in the default namespace and slighly misused to simulate load balancing. 

To start with, let's assume that the bgdemo-blue namespace shall host the current production version (0.3.6) while the green namespace contains the preproduction version (0.4.0) of the next release. As a next step, green will get the new production version and traffic is shifted from blue to green. 


1. Create Namespaces
```
kubectl create ns bgdemo-blue
kubectl create ns bgdemo-green
kubectl label ns bgdemo-green istio-injection=enabled
```

2. Dynatrace Product: Add Kubernetes rule to your Cloud Application and Workload Detection Settings
This rule will make sure that workloads are merged across the two namespaces into the same process group and hence, Dynatrace Service. 
![Screenshot of Dynatrace Cloud Application and Workload Detection Settings](./Dynatrace CAAWD K8s rule - bluegreen.png) 

3. Deploy prod hipster-shop to namespace bgdemo-blue and deploy loadgenerator to namespace default
```
kubectl apply -f blue/ -n bgdemo-blue
kubectl apply -f loadgen-blue.yaml
```

4. Deploy pre-prod hipster-shop to namespace bgdemo-green and generate some additional load towards this pre-prod environment
```
kubectl apply -f green-preprod/ -n bgdemo-green
kubectl apply -f loadgen-preprod-green.yaml
```
5. Review resulting services within Dynatrace
Dynatrace will detect and display different services for each namespace, since STAGE is included in the rule we have added in STEP 2 but differs between blue and green namespace (PROD vs. PREPROD)

6. Release and Deploy v0.4.0 as new production version
```
kubectl delete -f loadgen-preprod-green.yaml
kubectl apply -f green/ -n bgdemo-green
kubectl apply -f loadgen-green.yaml
```

7. Review and analyse what has changed within Dynatrace
- Services will now be merged (blue/green) since STAGE is PROD for all of them
- Traffic is shifted from blue to green namespace
- Response time increased after deployment (since Istio was used for injection delay at paymentservice and productcatalogservice)
- Use Multi-Dimensional-Analysis (metric: Response-time metric) and split by dimension ApplicationReleaseVersion 


## Canary Deployment