export class EurekaServiceDiscovery {
  constructor(eurekaClient) {
    this.client = eurekaClient;
  }

  // Get instance of a service by name
  getServiceInstance(serviceName) {
    const instances = this.client.getInstancesByAppId(
      serviceName.toUpperCase(),
    );

    if (!instances || instances.length === 0) {
      return null;
    }

    // Return first available instance
    return instances.find((instance) => instance.status === "UP");
  }

  // Get service URL
  getServiceUrl(serviceName) {
    const instance = this.getServiceInstance(serviceName);

    if (!instance) {
      throw new Error(`Service ${serviceName} not found in Eureka`);
    }

    const protocol =
      instance.securePort?.["@enabled"] === "true" ? "https" : "http";
    return `${protocol}://${instance.hostName}:${instance.port.$}`;
  }

  // Get all instances of a service
  getAllServiceInstances(serviceName) {
    return this.client.getInstancesByAppId(serviceName.toUpperCase());
  }

  // Load balance between multiple instances (simple round-robin)
  getLoadBalancedInstance(serviceName) {
    const instances = this.client.getInstancesByAppId(
      serviceName.toUpperCase(),
    );

    if (!instances || instances.length === 0) {
      throw new Error(`No instances found for service: ${serviceName}`);
    }

    const upInstances = instances.filter((i) => i.status === "UP");

    if (upInstances.length === 0) {
      throw new Error(`No UP instances found for service: ${serviceName}`);
    }

    // Simple round-robin
    const index = Math.floor(Math.random() * upInstances.length);
    return upInstances[index];
  }
}
