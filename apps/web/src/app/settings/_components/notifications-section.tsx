"use client";

/**
 * Notifications section — doc 08 §5.6.
 *
 * Determines which alerts from doc 05 deliver off-app, and when.
 */

import { useState } from "react";
import { FormRow, Select, TextInput, Toggle } from "./form-row";
import { SettingsSection } from "./settings-section";

export type NotificationChannel = "email" | "in-app" | "sms";
export type NotificationCategory = "critical" | "warning" | "informational";

export interface NotificationsFormValues {
  channels: Record<NotificationChannel, boolean>;
  categories: Record<NotificationCategory, Record<NotificationChannel, boolean>>;
  weeklyDigest: boolean;
  digestDay: "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
}

export interface NotificationsSectionProps {
  initial: NotificationsFormValues;
  onSave: (values: NotificationsFormValues) => Promise<void>;
  /** SMS channel is future — hide it until server support is live. */
  smsEnabled?: boolean;
}

const CATEGORY_LABELS: Record<NotificationCategory, { label: string; helper: string }> = {
  critical: {
    label: "Critical alerts",
    helper: "Safety, fault, or high-cost issues that need immediate attention.",
  },
  warning: {
    label: "Warnings",
    helper: "Signals that can wait but may worsen without action.",
  },
  informational: {
    label: "Informational",
    helper: "New opportunities, tips, and weekly context.",
  },
};

export function NotificationsSection({
  initial,
  onSave,
  smsEnabled = false,
}: NotificationsSectionProps) {
  const [values, setValues] = useState<NotificationsFormValues>(initial);

  const update = <K extends keyof NotificationsFormValues>(key: K, value: NotificationsFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const setChannel = (channel: NotificationChannel, enabled: boolean) => {
    setValues((prev) => ({
      ...prev,
      channels: { ...prev.channels, [channel]: enabled },
    }));
  };

  const setCategoryChannel = (
    category: NotificationCategory,
    channel: NotificationChannel,
    enabled: boolean,
  ) => {
    setValues((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: { ...prev.categories[category], [channel]: enabled },
      },
    }));
  };

  const channels: Array<{ id: NotificationChannel; label: string }> = [
    { id: "in-app", label: "In-app" },
    { id: "email", label: "Email" },
    ...(smsEnabled ? [{ id: "sms" as const, label: "SMS" }] : []),
  ];

  return (
    <SettingsSection
      id="notifications"
      title="Notifications"
      description="Which alerts reach you off-app, on which channel, and when."
      onSave={() => onSave(values)}
    >
      <FormRow label="Channels" helper="Turn on the channels you want to receive alerts on.">
        <div className="flex flex-wrap gap-4">
          {channels.map((c) => (
            <Toggle
              key={c.id}
              id={`ch-${c.id}`}
              checked={values.channels[c.id]}
              onChange={(next) => setChannel(c.id, next)}
              label={c.label}
            />
          ))}
        </div>
      </FormRow>

      {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((cat) => (
        <FormRow key={cat} label={CATEGORY_LABELS[cat].label} helper={CATEGORY_LABELS[cat].helper}>
          <div className="flex flex-wrap gap-4">
            {channels.map((c) => (
              <Toggle
                key={`${cat}-${c.id}`}
                id={`cat-${cat}-${c.id}`}
                checked={values.categories[cat]?.[c.id] ?? false}
                onChange={(next) => setCategoryChannel(cat, c.id, next)}
                label={c.label}
                disabled={!values.channels[c.id]}
              />
            ))}
          </div>
        </FormRow>
      ))}

      <FormRow label="Weekly digest" helper="A short summary of your system's week every Monday morning.">
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            id="digest"
            checked={values.weeklyDigest}
            onChange={(next) => update("weeklyDigest", next)}
            label={values.weeklyDigest ? "Enabled" : "Off"}
          />
          <Select
            value={values.digestDay}
            disabled={!values.weeklyDigest}
            onChange={(e) => update("digestDay", e.target.value as NotificationsFormValues["digestDay"])}
          >
            <option value="Sun">Sunday</option>
            <option value="Mon">Monday</option>
            <option value="Tue">Tuesday</option>
            <option value="Wed">Wednesday</option>
            <option value="Thu">Thursday</option>
            <option value="Fri">Friday</option>
            <option value="Sat">Saturday</option>
          </Select>
        </div>
      </FormRow>

      <FormRow label="Quiet hours" helper="We won't send non-critical alerts during this window.">
        <div className="flex flex-wrap items-center gap-3">
          <Toggle
            id="notif-quiet"
            checked={values.quietHoursEnabled}
            onChange={(next) => update("quietHoursEnabled", next)}
            label={values.quietHoursEnabled ? "On" : "Off"}
          />
          <div className="flex items-center gap-2">
            <TextInput
              type="time"
              value={values.quietStart}
              disabled={!values.quietHoursEnabled}
              onChange={(e) => update("quietStart", e.target.value)}
            />
            <span className="text-sm text-muted-foreground">–</span>
            <TextInput
              type="time"
              value={values.quietEnd}
              disabled={!values.quietHoursEnabled}
              onChange={(e) => update("quietEnd", e.target.value)}
            />
          </div>
        </div>
      </FormRow>
    </SettingsSection>
  );
}
