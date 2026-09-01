import { BadRequestException, Injectable } from "@nestjs/common";
import { InverterConnector, InverterVendorId } from "./inverter-connector.interface";
import { MockInverterConnector } from "./mock.connector";
import { SolarEdgeConnector } from "./solaredge.connector";

/**
 * Resolves a vendor id to its connector implementation.
 * Vendors without a real adapter yet (Enphase, Fronius, SMA) are declared
 * in the schema but rejected here with an actionable message.
 */
@Injectable()
export class ConnectorFactory {
  constructor(
    private readonly solarEdge: SolarEdgeConnector,
    private readonly mock: MockInverterConnector
  ) {}

  forVendor(vendor: InverterVendorId): InverterConnector {
    switch (vendor) {
      case "solaredge":
        return this.solarEdge;
      case "mock":
        return this.mock;
      default:
        throw new BadRequestException(
          `Inverter vendor "${vendor}" is not supported yet. Supported: solaredge, mock.`
        );
    }
  }
}
