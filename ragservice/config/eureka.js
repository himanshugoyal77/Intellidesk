import { Eureka } from "eureka-js-client";
import os from "os";

// Get local IP address
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
};

export const createEurekaClient = (port) => {
  const serviceName = process.env.SERVICE_NAME || "rag-service";
  const serviceHost = process.env.SERVICE_HOST || "localhost";
  const serviceIP = process.env.SERVICE_IP || getLocalIP();
  const eurekaHost = process.env.EUREKA_HOST || "localhost";
  const eurekaPort = process.env.EUREKA_PORT || 8761;

  const client = new Eureka({
    instance: {
      app: serviceName.toUpperCase(),
      instanceId: `${serviceHost}:${serviceName}:${port}`,
      hostName: serviceHost,
      ipAddr: serviceIP,
      statusPageUrl: `http://${serviceHost}:${port}/health`,
      healthCheckUrl: `http://${serviceHost}:${port}/health`,
      port: {
        $: port,
        "@enabled": "true",
      },
      vipAddress: serviceName,
      dataCenterInfo: {
        "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
        name: "MyOwn",
      },
      // Lease settings
      leaseInfo: {
        renewalIntervalInSecs: 30,
        durationInSecs: 90,
      },
    },
    eureka: {
      host: eurekaHost,
      port: eurekaPort,
      servicePath: "/eureka/apps/",
      // Fetch registry settings
      fetchRegistry: true,
      registerWithEureka: true,
      // Heartbeat settings
      heartbeatInterval: 30000, // 30 seconds
      registryFetchInterval: 30000, // 30 seconds
    },
    // Retry settings
    requestRetryDelay: 10000,
    maxRetries: 3,
  });

  return client;
};
