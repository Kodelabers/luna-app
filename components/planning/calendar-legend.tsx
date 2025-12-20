"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CellStatus, getCellColor } from "@/lib/utils/colors";
import { Info } from "lucide-react";

export function CalendarLegend() {
  const legendItems = [
    {
      status: CellStatus.APPROVED,
      label: "Odobreni odmori",
      description: "Zahtjevi koji su konačno odobreni",
    },
    {
      status: CellStatus.PENDING,
      label: "Na čekanju",
      description: "Zahtjevi koji čekaju odobrenje",
    },
    {
      status: CellStatus.SICK_LEAVE,
      label: "Bolovanje",
      description: "Evidentirana bolovanja",
    },
    {
      status: CellStatus.CRITICAL,
      label: "Kritično razdoblje",
      description: "3+ zaposlenika odsutno istovremeno",
    },
    {
      status: CellStatus.AVAILABLE,
      label: "Dostupno",
      description: "Vikend, praznici ili slobodni dani",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5" />
          Legenda
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {legendItems.map((item) => (
            <div key={item.status} className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded ${getCellColor(item.status)} border border-border`}
              />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

