## Longshoreman Controller

The controller manages the application container cluster. It works with one
or more routers to create a highly available and redundant cluster for Docker-based
applications.

The controller exposes a number of utility API endpoints that can be used to manage
the cluster state using the CLI tool.

### Lingo

#### Hosts
A host is a single node's IP. Multiple application instances can be deployed on a
single host. When deploying a new application instance, hosts with the least utilization
are selected for deployment. Hosts can be added or removed from the cluster at any time.

#### Apps
An App is represented by a domain name and a set of environmental variables. App
instances are deployed to multiple hosts. Ports are dynamically assigned and propagated
to the routers. Longshoreman applications must include an `EXPOSE 3000` port as the external to internal port mapping is currently not configurable. This will change shortly.

#### Instances
Application instances are deployed to hosts using the built in Docker Remote API.

#### Envs
Each application can be configured using environmental variables. Variables can be set
at any time and will trigger a restart.

#### Router
Traffic is routed to application components via the routers. Routers are applications
which dynamically HTTP requests to the appropriate back-end instances. Routers are
notified of updates to the routing table using Redis PubSub.

### Endpoints

These endpoints are utilized by the CLI tool.

#### `GET /apps`
Load the currently configured applications.

#### `GET /hosts`
Load the IPs of all hosts in the cluster.

#### `POST /hosts`
Add a new host to the cluster.

#### `DELETE /hosts/:host`
Remove a host from the cluster.

#### `POST /:app/deploy => '{"image": "docker/image"}'`
Deploy an application to the cluster. Specify a Docker image name.

#### `GET /:app/instances`
Return all instances for an application.

#### `GET /:app/envs`
Get all environmental variables for an application.

#### `POST /:app/envs`
Add a new environmental variables to an application.

#### `DELETE /:app/envs/:env`
Remove an environmental variables from an application.

## Start a Controller

Just run `sudo docker.io run -e REDIS_HOST=$REDIS_HOST_IP -e REDIS_PORT=6379 longshoreman/controller` on your controller node(s) to start directing traffic to your Docker application instances. `$REDIS_HOST_IP` is the IP address of your Redis database.

### TODO

* Better error handling for failed image downloads

* Storing revisions for application state will allow for simple rollback. However,
rollbacks can still be achieved by deploying a specific Docker image tag.

* Smarter handling of host removal and addition. The controller should redistribute
application instances across the cluster based on available resources.

* etcd support to eliminate single points of failure. Currently uses Redis.
