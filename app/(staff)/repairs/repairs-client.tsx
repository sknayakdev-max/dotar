"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  Wrench,
} from "lucide-react";

import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";

import type { User } from "@/lib/types";

import {
  createRepairAction,
  updateRepairAction,
  deleteRepairAction,
  type RepairItem,
  type RepairForm,
  type CustomerOption,
  type DeviceOption,
  type EmployeeOption,
} from "./actions";

type Props = {
  user: User;
  initialRepairs: RepairItem[];
  initialCustomers: CustomerOption[];
  initialDevices: DeviceOption[];
  initialEmployees: EmployeeOption[];
  initialError?: string;
};

export default function RepairsClient({
  user,
  initialRepairs,
  initialCustomers,
  initialDevices,
  initialEmployees,
  initialError,
}: Props) {
  const [repairs, setRepairs] =
    useState(initialRepairs);

  const [customers] =
    useState(initialCustomers);

  const [devices] =
    useState(initialDevices);

  const [employees] =
    useState(initialEmployees);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState(initialError || "");

  const [creating, setCreating] =
    useState(false);

  const [editing, setEditing] =
    useState<RepairItem | null>(null);

  const [viewing, setViewing] =
    useState<RepairItem | null>(null);

  const filtered = useMemo(() => {
    const query = search
      .toLowerCase()
      .trim();

    if (!query) {
      return repairs;
    }

    return repairs.filter(
      (repair) =>
        repair.repairNumber
          ?.toLowerCase()
          .includes(query) ||
        repair.customerName
          .toLowerCase()
          .includes(query) ||
        repair.deviceName
          .toLowerCase()
          .includes(query) ||
        repair.assignedToName
          .toLowerCase()
          .includes(query) ||
        repair.status
          .toLowerCase()
          .includes(query) ||
        repair.priority
          .toLowerCase()
          .includes(query)
    );
  }, [repairs, search]);

  async function remove(id: string) {
    if (
      !window.confirm(
        "Delete this repair?"
      )
    ) {
      return;
    }

    const result =
      await deleteRepairAction(id);

    if (result.error) {
      setError(result.error);
      return;
    }

    setRepairs((current) =>
      current.filter(
        (repair) =>
          repair.id !== id
      )
    );
  }

  return (
    <div className="staff-dashboard">

      <DashboardSidebar user={user} />

      <div className="dashboard-main">

        <DashboardHeader user={user} />

        <main className="dashboard-content">

          {/* =====================================================
              HEADER
          ===================================================== */}

          <div className="dashboard-welcome">

            <div>
              <p className="dashboard-kicker">
                REPAIR MANAGEMENT
              </p>

              <h1>
                Repairs
              </h1>

              <p>
                Manage and track customer repair jobs.
              </p>
            </div>

            <div className="customer-header-actions">

              <div className="customer-search-box">

                <Search size={17} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search repairs..."
                  aria-label="Search repairs"
                />

              </div>

              <button
                type="button"
                className="new-repair-button"
                onClick={() =>
                  setCreating(true)
                }
              >
                <Plus size={16} />
                Add repair
              </button>

            </div>

          </div>

          {/* =====================================================
              ERROR
          ===================================================== */}

          {error && (
            <div className="dashboard-card customer-error">
              <p className="error-message">
                {error}
              </p>
            </div>
          )}

          {/* =====================================================
              TABLE
          ===================================================== */}

          <div className="dashboard-card customer-table-card">

            <div className="customer-table-toolbar">

              <span className="toolbar-count">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "repair"
                  : "repairs"}
              </span>

            </div>

            <div className="overflow-x-auto">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Repair</th>
                    <th>Customer</th>
                    <th>Device</th>
                    <th>Technician</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filtered.length === 0 ? (

                    <tr>
                      <td
                        colSpan={8}
                        className="customer-empty-cell"
                      >
                        <div className="customer-empty">

                          <div className="customer-empty-icon">
                            <Wrench size={23} />
                          </div>

                          <h3>
                            {search.trim()
                              ? "No repairs found"
                              : "No repairs found."}
                          </h3>

                          <p>
                            {search.trim()
                              ? "Try a different search term."
                              : "Add your first repair to get started."}
                          </p>

                          {!search.trim() && (
                            <button
                              type="button"
                              className="customer-empty-button"
                              onClick={() =>
                                setCreating(true)
                              }
                            >
                              <Plus size={16} />
                              Add repair
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>

                  ) : (

                    filtered.map(
                      (repair) => (

                        <tr
                          key={
                            repair.id
                          }
                        >

                          <td>
                            <strong>
                              {repair.repairNumber ||
                                repair.id.slice(
                                  0,
                                  8
                                )}
                            </strong>
                          </td>

                          <td>
                            {
                              repair.customerName
                            }
                          </td>

                          <td>
                            {
                              repair.deviceName
                            }
                          </td>

                          <td>
                            {
                              repair.assignedToName
                            }
                          </td>

                          <td>
                            <span
                              className={`repair-priority repair-priority-${repair.priority.toLowerCase()}`}
                            >
                              {formatLabel(
                                repair.priority
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`repair-status repair-status-${repair.status.toLowerCase()}`}
                            >
                              {formatLabel(
                                repair.status
                              )}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              repair.createdAt
                            )}
                          </td>

                          <td>

                            <div className="table-actions">

                              <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                  setViewing(
                                    repair
                                  )
                                }
                                title="View repair"
                                aria-label="View repair"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                  setEditing(
                                    repair
                                  )
                                }
                                title="Edit repair"
                                aria-label="Edit repair"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-button danger"
                                onClick={() =>
                                  remove(
                                    repair.id
                                  )
                                }
                                title="Delete repair"
                                aria-label="Delete repair"
                              >
                                <Trash2 size={16} />
                              </button>

                            </div>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </main>

      </div>

      {/* =====================================================
          CREATE / EDIT DRAWER
      ===================================================== */}

      {(creating || editing) && (
        <RepairDrawer
          repair={editing}
          customers={customers}
          devices={devices}
          employees={employees}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(repair) => {

            setRepairs((current) => {

              const exists =
                current.some(
                  (item) =>
                    item.id ===
                    repair.id
                );

              if (exists) {
                return current.map(
                  (item) =>
                    item.id ===
                    repair.id
                      ? repair
                      : item
                );
              }

              return [
                repair,
                ...current,
              ];
            });

            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {/* =====================================================
          VIEW DRAWER
      ===================================================== */}

      {viewing && (
        <RepairDetails
          repair={viewing}
          onClose={() =>
            setViewing(null)
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   REPAIR DRAWER
========================================================= */

function RepairDrawer({
  repair,
  customers,
  devices,
  employees,
  onClose,
  onSaved,
}: {
  repair: RepairItem | null;
  customers: CustomerOption[];
  devices: DeviceOption[];
  employees: EmployeeOption[];
  onClose: () => void;
  onSaved: (
    repair: RepairItem
  ) => void;
}) {
  const [form, setForm] =
    useState<RepairForm>({
      repairNumber:
        repair?.repairNumber || "",

      customerId:
        repair?.customerId || "",

      deviceId:
        repair?.deviceId || "",

      assignedToId:
        repair?.assignedToId || "",

      problemDescription:
        repair?.problemDescription || "",

      diagnosis:
        repair?.diagnosis || "",

      initialCondition:
        repair?.initialCondition || "",

      accessoriesReceived:
        repair?.accessoriesReceived || "",

      priority:
        repair?.priority || "NORMAL",

      status:
        repair?.status || "RECEIVED",

      estimatedCost:
        repair?.estimatedCost?.toString() ||
        "",

      advancePayment:
        repair?.advancePayment?.toString() ||
        "",

      expectedCompletionDate:
        repair?.expectedCompletionDate
          ? repair.expectedCompletionDate.slice(
              0,
              10
            )
          : "",

      customerNotes:
        repair?.customerNotes || "",

      internalNotes:
        repair?.internalNotes || "",
    });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const filteredDevices =
    form.customerId
      ? devices.filter(
          (device) =>
            !device.customerId ||
            device.customerId ===
              form.customerId
        )
      : devices;

  function update(
    field: keyof RepairForm,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,

      ...(field === "customerId"
        ? {
            deviceId: "",
          }
        : {}),
    }));
  }

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !form.customerId ||
      !form.problemDescription.trim()
    ) {
      setError(
        "Customer and problem description are required."
      );
      return;
    }

    setSaving(true);
    setError("");

    const result = repair
      ? await updateRepairAction(
          repair.id,
          form
        )
      : await createRepairAction(
          form
        );

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    if (result.repair) {
      onSaved(
        result.repair
      );
    }
  }

  return (
    <div className="customer-drawer-overlay">

      <aside className="customer-drawer repair-drawer">

        {/* HEADER */}

        <div className="customer-drawer-header">

          <div>

            <p className="dashboard-kicker">
              REPAIR
            </p>

            <h2>
              {repair
                ? "Edit repair"
                : "Add repair"}
            </h2>

            <p className="customer-drawer-subtitle">
              {repair
                ? "Update repair job information."
                : "Create a new repair job."}
            </p>

          </div>

          <button
            type="button"
            className="customer-drawer-close"
            onClick={onClose}
            aria-label="Close repair form"
          >
            <X size={20} />
          </button>

        </div>

        {/* FORM */}

        <form
          onSubmit={submit}
          className="customer-form repair-form"
        >

          {error && (
            <div className="customer-form-error">
              {error}
            </div>
          )}

          {/* Customer / Device */}

          <div className="customer-form-row">

            <SelectField
              label="Customer"
              value={form.customerId}
              onChange={(value) =>
                update(
                  "customerId",
                  value
                )
              }
              required
            >
              <option value="">
                Select customer
              </option>

              {customers.map(
                (customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                    {customer.phone
                      ? ` — ${customer.phone}`
                      : ""}
                  </option>
                )
              )}
            </SelectField>

            <SelectField
              label="Device"
              value={form.deviceId}
              onChange={(value) =>
                update(
                  "deviceId",
                  value
                )
              }
            >
              <option value="">
                Select device
              </option>

              {filteredDevices.map(
                (device) => (
                  <option
                    key={device.id}
                    value={device.id}
                  >
                    {device.name}
                  </option>
                )
              )}
            </SelectField>

          </div>

          {/* Repair number / Technician */}

          <div className="customer-form-row">

            <RepairInput
              label="Repair number"
              value={
                form.repairNumber
              }
              onChange={(value) =>
                update(
                  "repairNumber",
                  value
                )
              }
              placeholder="Auto-generated if empty"
            />

            <SelectField
              label="Assigned technician"
              value={
                form.assignedToId
              }
              onChange={(value) =>
                update(
                  "assignedToId",
                  value
                )
              }
            >
              <option value="">
                Unassigned
              </option>

              {employees.map(
                (employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                  </option>
                )
              )}
            </SelectField>

          </div>

          {/* Problem */}

          <TextAreaField
            label="Problem description"
            value={
              form.problemDescription
            }
            onChange={(value) =>
              update(
                "problemDescription",
                value
              )
            }
            placeholder="Describe the customer's reported problem..."
            required
            rows={4}
          />

          {/* Initial condition */}

          <TextAreaField
            label="Initial condition"
            value={
              form.initialCondition
            }
            onChange={(value) =>
              update(
                "initialCondition",
                value
              )
            }
            placeholder="Describe the condition when received..."
            rows={3}
          />

          {/* Accessories */}

          <TextAreaField
            label="Accessories received"
            value={
              form.accessoriesReceived
            }
            onChange={(value) =>
              update(
                "accessoriesReceived",
                value
              )
            }
            placeholder="Charger, case, cable, etc."
            rows={3}
          />

          {/* Diagnosis */}

          <TextAreaField
            label="Diagnosis"
            value={form.diagnosis}
            onChange={(value) =>
              update(
                "diagnosis",
                value
              )
            }
            placeholder="Technician diagnosis..."
            rows={3}
          />

          {/* Priority / Status */}

          <div className="customer-form-row">

            <SelectField
              label="Priority"
              value={
                form.priority
              }
              onChange={(value) =>
                update(
                  "priority",
                  value
                )
              }
            >
              <option value="LOW">
                Low
              </option>

              <option value="NORMAL">
                Normal
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="URGENT">
                Urgent
              </option>
            </SelectField>

            <SelectField
              label="Status"
              value={
                form.status
              }
              onChange={(value) =>
                update(
                  "status",
                  value
                )
              }
            >
              <option value="RECEIVED">
                Received
              </option>

              <option value="DIAGNOSING">
                Diagnosing
              </option>

              <option value="IN_PROGRESS">
                In progress
              </option>

              <option value="WAITING_PARTS">
                Waiting for parts
              </option>

              <option value="READY">
                Ready
              </option>

              <option value="COMPLETED">
                Completed
              </option>

              <option value="CANCELLED">
                Cancelled
              </option>
            </SelectField>

          </div>

          {/* Cost */}

          <div className="customer-form-row">

            <RepairInput
              label="Estimated cost"
              type="number"
              min="0"
              step="0.01"
              value={
                form.estimatedCost
              }
              onChange={(value) =>
                update(
                  "estimatedCost",
                  value
                )
              }
              placeholder="0.00"
            />

            <RepairInput
              label="Advance payment"
              type="number"
              min="0"
              step="0.01"
              value={
                form.advancePayment
              }
              onChange={(value) =>
                update(
                  "advancePayment",
                  value
                )
              }
              placeholder="0.00"
            />

          </div>

          {/* Expected completion */}

          <RepairInput
            label="Expected completion"
            type="date"
            value={
              form.expectedCompletionDate
            }
            onChange={(value) =>
              update(
                "expectedCompletionDate",
                value
              )
            }
          />

          {/* Customer notes */}

          <TextAreaField
            label="Customer notes"
            value={
              form.customerNotes
            }
            onChange={(value) =>
              update(
                "customerNotes",
                value
              )
            }
            placeholder="Notes visible to the customer..."
            rows={3}
          />

          {/* Internal notes */}

          <TextAreaField
            label="Internal notes"
            value={
              form.internalNotes
            }
            onChange={(value) =>
              update(
                "internalNotes",
                value
              )
            }
            placeholder="Internal staff notes..."
            rows={3}
          />

          {/* BUTTONS */}

          <div className="customer-form-actions">

            <button
              type="button"
              className="customer-cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="customer-create-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : repair
                ? "Save changes"
                : "Create repair"}
            </button>

          </div>

        </form>

      </aside>

    </div>
  );
}

/* =========================================================
   REPAIR DETAILS
========================================================= */

function RepairDetails({
  repair,
  onClose,
}: {
  repair: RepairItem;
  onClose: () => void;
}) {
  return (
    <div className="customer-drawer-overlay">

      <aside className="customer-drawer repair-drawer">

        <div className="customer-drawer-header">

          <div>

            <p className="dashboard-kicker">
              REPAIR
            </p>

            <h2>
              {repair.repairNumber ||
                "Repair details"}
            </h2>

            <p className="customer-drawer-subtitle">
              {repair.customerName}
              {" · "}
              {repair.deviceName}
            </p>

          </div>

          <button
            type="button"
            className="customer-drawer-close"
            onClick={onClose}
            aria-label="Close repair details"
          >
            <X size={20} />
          </button>

        </div>

        <div className="repair-details">

          <div className="repair-detail-status-row">

            <span
              className={`repair-status repair-status-${repair.status.toLowerCase()}`}
            >
              {formatLabel(
                repair.status
              )}
            </span>

            <span
              className={`repair-priority repair-priority-${repair.priority.toLowerCase()}`}
            >
              {formatLabel(
                repair.priority
              )}
            </span>

          </div>

          <div className="repair-detail-grid">

            <Detail
              label="Customer"
              value={
                repair.customerName
              }
            />

            <Detail
              label="Device"
              value={
                repair.deviceName
              }
            />

            <Detail
              label="Technician"
              value={
                repair.assignedToName
              }
            />

            <Detail
              label="Created"
              value={formatDate(
                repair.createdAt
              )}
            />

            <Detail
              label="Estimated cost"
              value={formatCurrency(
                repair.estimatedCost
              )}
            />

            <Detail
              label="Advance payment"
              value={formatCurrency(
                repair.advancePayment
              )}
            />

            <Detail
              label="Expected completion"
              value={
                repair.expectedCompletionDate
                  ? formatDate(
                      repair.expectedCompletionDate
                    )
                  : "—"
              }
            />

          </div>

          <RepairDetailText
            label="Problem description"
            value={
              repair.problemDescription
            }
          />

          <RepairDetailText
            label="Initial condition"
            value={
              repair.initialCondition
            }
          />

          <RepairDetailText
            label="Accessories received"
            value={
              repair.accessoriesReceived
            }
          />

          <RepairDetailText
            label="Diagnosis"
            value={
              repair.diagnosis
            }
          />

          <RepairDetailText
            label="Customer notes"
            value={
              repair.customerNotes
            }
          />

          <RepairDetailText
            label="Internal notes"
            value={
              repair.internalNotes
            }
          />

        </div>

      </aside>

    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function RepairInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  step?: string;
}) {
  return (
    <div className="customer-form-field">

      <label>
        {label}
      </label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        step={step}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  required = false,
  children,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="customer-form-field">

      <label>
        {label}
        {required && (
          <span className="required-mark">
            {" "}*
          </span>
        )}
      </label>

      <select
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      >
        {children}
      </select>

    </div>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div className="customer-form-field">

      <label>
        {label}
        {required && (
          <span className="required-mark">
            {" "}*
          </span>
        )}
      </label>

      <textarea
        rows={rows}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </div>
  );
}

/* =========================================================
   DETAIL
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="customer-detail-item">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

function RepairDetailText({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className="repair-detail-text">

      <span>
        {label}
      </span>

      <p>
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatLabel(
  value: string
) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );
}

function formatDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatCurrency(
  value: number
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }
  ).format(value || 0);
}