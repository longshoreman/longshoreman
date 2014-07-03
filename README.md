![Longshoreman](http://i.imgur.com/4vkVHdI.png)

# Longshoreman

Longshoreman automates application deployment using Docker. Just create a Docker repository (or use a service), configure the cluster using AWS or Digital Ocean (or whatever you like) and deploy applications using a Heroku-like CLI tool. We're currently using it in production at [Wayfinder](http://wayfinder.co) to orchestrate the deployment of microservices.

[Main project page](https://github.com/longshoreman)

## Why make this?

We created Longshoreman because we love using Docker but were frustrated with the lack of production-ready deployment options that were available at the time. We looked closely at Deis, Flynn, Dokku and others, but they either did not meet our requirements or were explicitly marked as not ready for production. We were extremely impressed by Deis in particular and it's use of bleeding edge technologies like CoreOS, etcd and systemd. The biggest shortcoming we found with Deis is that it rebuilds Dockerfiles from scratch for each deploy (afaik).

## How does it work?

Longshoremen has 3 core components: a Controller, one or more Routers and the CLI. It also uses a Docker registry and Redis as it's configuration database.

## Controller

The Longshoreman controller is a service which orchestrates the deployment of Docker applications across a cluster and controls how traffic (web or what have you) is routed to individual application instances. It communicates over HTTP with the CLI tool. Launching a new version of an application is as simple as `longshoreman --app my.app.com deploy docker.repo.com/image:tag`. Your application will be deployed to 2 or more nodes (depending on the size of your cluster and it's available resources). Versioning and rollbacks can be achieved using image tags.

[Controller Repository](https://github.com/longshoreman/controller)

## Routers

Routers dynamically direct incoming web traffic to the correct application instances. They are simple Node.js reverse proxies that pass requests on to the underlying application instances. Multiple routers can be utilized to distribute traffic and eliminate single points of failure.

[Router Repository](https://github.com/longshoreman/router)

## CLI

The command line tool is an interface to the Longshoreman controller service. It allows users to describe the state of the application cluster, deploy new instances of applications (with zero-downtime), add and remove hosts, add and remove application environmental variables and more. See the link below for full documentation.

[CLI Repository](https://github.com/longshoreman/cli)

### Other Components

#### Registry

Longshoreman uses a Docker registry (most likely private) to coordinate application versioning and deployment. Docker registries are outside of the scope of this project, so if you're unfamiliar with them please [read more here](https://github.com/dotcloud/docker-registry). You will need a Docker registry (most likely a private one) to use Longshoreman. There are several private registry hosting
companies (including Docker proper) that provide this service for a low cost. You can also host a registry yourself (preferred). Setting up an S3-backed private registry is fairly simple. Just follow [these instructions](https://github.com/dotcloud/docker-registry).

#### Configuration Store

We are currently using Redis to store and distribute the cluster's state. Longshoreman uses PubSub to notify Routers of updates to the internal application routing table. We're looking into support for etcd as a single point of failure exists if the Redis instance is not redundant.

![Diagram](http://i.imgur.com/I0POpX4.png)

## Quick Start

This guide will walk you through creating a Longshoreman powered cluster (we're using EC2 running Ubuntu in this example).

To create an application cluster using Longshoreman, you'll need at least 2 server nodes. However we recommend using 5 for enhanced robustness. Here's how they're broken down: 1 router, 1 controller, 2 application nodes and a Redis box (using a Redis hosting provider will work well too). In the 2 node set up the router, controller and Redis db can live on a single server (but that's not recommended). Actually, the whole thing can run on a single server if you're just taking a test drive, but I digress.

### 1. Launch a controller

1. Launch an EC2 instance and log into the box.
2. Install Docker with `sudo apt-get install docker.io`
3. Start the controller with `sudo docker.io run -e REDIS_HOST=$REDIS_HOST_IP -e REDIS_PORT=6379 longshoreman/controller`

### 2. Launch the router(s)

1. Launch an EC2 instance and log into the box.
1. Install Docker with `sudo apt-get install docker.io`
1. Start the router with `sudo docker.io run -e REDIS_HOST=$REDIS_HOST_IP -e REDIS_PORT=6379 longshoreman/router`
1. Configure your load balancer (ELB, etc.) to direct traffic to the router instance(s).

### 3. Deploy container nodes

1. Launch 1 or more EC2 instances.
1. Install Docker with `sudo apt-get install docker.io`
1. Edit the Docker config with `vi /etc/docker.io`
1. Set `DOCKER_OPTS="-H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock"` to enable the Docker Remote API
1. Restart Docker with `sudo service docker.io restart`
1. Create an AMI if you'd like to speed up this step next time you launch a container node.

### 4. Configure and deploy applications using the CLI

1. Run `longshoreman init` to configure your credentials. Enter the Longshoreman controller domain and your token. The token is auto-generated and is stored in Redis (`GET token`).
1. `longshoreman hosts:add <container-node-ip>` to make Longshoreman aware of your nodes.
1. `longshoreman apps:add my.app.domain` to add a new service or application to your cluster.
1. `longshoreman --app my.app.domain envs:set FOO=bar` to configure your application's runtime settings.
1. `longshoreman --app my.app.domain deploy my.docker.reg/repo:tag` to deploy the first version of your application.
1. Point your domain to your load balancer's CNAME and Bob's your uncle.

Check out [the CLI repository](https://github.com/longshoreman/cli) for full documentation.

## Using SSL

We currently recommend using something like ELB where SSL termination happens on the load balancer. We will be adding support for SSL at the router level soon.



