import { z } from "zod/v4";
import { DateTime } from "luxon";
import _ from "lodash";

const Station = z.object({
  code: z.string(),
  name: z.string().optional(),
  facility: z.string().optional(),
  timeZone: z.string().optional(),
});

const ArrivalDeparture = z.object({
  schedule: z.object({
    dateTime: z.iso.datetime({ offset: true }),
  }),
  statusInfo: z.object({
    status: z.string(),
    displayStatus: z.string(),
    displayMessage: z.string().optional(),
    dateTimeType: z.string().optional(),
    dateTime: z.iso.datetime({ offset: true }).optional(),
    asOf: z.iso.datetime({ offset: true }).optional(),
    comment: z.string().optional(),
  }),
  gate: z
    .object({
      number: z.string(),
      asOf: z.iso.datetime({ offset: true }),
    })
    .optional(),
  track: z
    .object({
      number: z.string(),
      asOf: z.iso.datetime({ offset: true }),
    })
    .optional(),
});

const Trip = z.object({
  id: z.string(),
  travelService: z.object({
    id: z.string(),
    number: z.string(),
    date: z.iso.date(),
    type: z
      .object({
        code: z.string(),
        description: z.string(),
      })
      .optional(),
    name: z.object({
      code: z.string(),
      description: z.string(),
    }),
    operator: z.object({
      code: z.string(),
      description: z.string().optional(),
      number: z.string().optional(),
    }),
    origin: Station,
    destination: Station,
  }),
  stopNum: z.string(), // should be number
  arrival: ArrivalDeparture.optional(),
  departure: ArrivalDeparture.optional(),
});

export type Trip = z.infer<typeof Trip>;

export type DepartureStatus =
  | "onTime"
  | "delayed"
  | "canceled"
  | "departed"
  | "unknown";

export function departureStatus(trip: Trip): DepartureStatus {
  if (trip.departure?.statusInfo.status == "CANCELED") {
    return "canceled";
  } else if (
    (trip.departure?.statusInfo.dateTimeType == "ACTUAL" &&
      DateTime.fromISO(trip.departure.statusInfo.dateTime!) < DateTime.now()) ||
    trip.departure?.statusInfo.displayStatus.toLowerCase().trim() == "departed"
  ) {
    return "departed";
  } else if (
    trip.departure!.statusInfo.dateTime! > trip.departure!.schedule.dateTime
  ) {
    return "delayed";
  } else if (
    DateTime.fromISO(
      trip.departure!.statusInfo.dateTime || trip.departure!.schedule.dateTime!
    ) < DateTime.now()
  ) {
    return "unknown";
  } else {
    return "onTime";
  }
}

export async function stationDepartures(stationCode: string): Promise<Trip[]> {
  const data = await fetch(
    `https://rider.amtrak.com/mobile/travel-service/statuses/stops/${stationCode}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148  iOS",
        appType: "IOS",
        versionNumber: "6.0.5",
        Accept: "*/*",
      },
    }
  ).then((r) => r.json());

  return _.sortBy(
    z
      .object({ data: z.array(Trip) })
      .parse(data)
      .data.filter(
        (trip) =>
          !!trip.departure &&
          !["THRU", "TEMP", "SLFT"].includes(trip.travelService.name.code) &&
          trip.travelService.operator.code == "AMTK" &&
          !!trip.travelService.destination.name &&
          trip.travelService.destination.code != stationCode // if the train's destination is our current station, it's not a departure, it's an arrival
      ),
    "departure.schedule.dateTime"
  );
}
