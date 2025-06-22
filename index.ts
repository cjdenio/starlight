import { z } from "zod/v4";
import { DateTime } from "luxon";
import _ from "lodash";
import { departureStatus, stationDepartures } from "./amtrak";
import type { BunRequest } from "bun";

Bun.serve({
  routes: {
    // "/:code": async (req) => {
    //   const departures = (await stationDepartures(req.params.code)).map(
    //     (trip) => ({
    //       number: trip.travelService.number,
    //       route: trip.travelService.name.description,
    //       estimatedDeparture:
    //         trip.departure?.statusInfo.dateTime ||
    //         trip.departure?.schedule.dateTime,
    //       scheduledDeparture: trip.departure?.schedule.dateTime,
    //       destination: trip.travelService.destination,
    //       origin: trip.travelService.origin,
    //       lastUpdate: trip.departure?.statusInfo.asOf,
    //       status: departureStatus(trip),
    //     })
    //   );

    //   return new Response(
    //     `
    //     <!DOCTYPE html>
    //     <table>
    //     ${departures
    //       .map(
    //         (d) => `<tr style="background-color: ${
    //           d.status == "onTime"
    //             ? "green"
    //             : d.status == "delayed"
    //             ? "red"
    //             : ""
    //         }">
    //         <td>${d.number}</td>
    //         <td>${d.route}</td>
    //         <td>${d.destination.name}</td>
    //         <td>${d.status}</td>
    //         <td>${DateTime.fromISO(
    //           d.estimatedDeparture || d.scheduledDeparture!
    //         )
    //           .diffNow(["hours", "minutes"], {
    //             conversionAccuracy: "casual",
    //           })
    //           .toHuman({
    //             unitDisplay: "short",
    //             roundingMode: "ceil",
    //             roundingPriority: "lessPrecision",
    //           })}</td>
    //       </tr>`
    //       )
    //       .join("")}
    //     </table>
    //     `,
    //     {
    //       headers: { "Content-Type": "text/html" },
    //     }
    //   );
    // },
    "/stations/:code/departures": async (req) => {
      return Response.json(
        (await stationDepartures(req.params.code)).map((trip) => ({
          number: trip.travelService.number,
          route: trip.travelService.name.description,
          estimatedDeparture:
            trip.departure?.statusInfo.dateTime ||
            trip.departure?.schedule.dateTime,
          scheduledDeparture: trip.departure?.schedule.dateTime,
          destination: trip.travelService.destination,
          origin: trip.travelService.origin,
          lastUpdate: trip.departure?.statusInfo.asOf,
          status: departureStatus(trip),
          gate: trip.departure?.gate?.number,
          track: trip.departure?.track?.number,
        }))
      );
    },
  },
});
