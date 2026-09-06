"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Search,
  Plus,
  X,
  Trash2,
  Eye,
} from "lucide-react";

import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";
import Toast from "@/components/toast";

import type { User } from "@/lib/types";

import {
  createServiceRequestAction,
  deleteServiceRequestAction,
  updateServiceRequestStatusAction,
  type ServiceRequestItem,
} from "./actions";

type Props = {
  user: User;
  initialRequests: ServiceRequestItem[];
  initialError?: string;
};

const DEVICE_TYPES = [
  "LAPTOP",
  "DESKTOP",
  "MOBILE",
  "TABLET",
  "PRINTER",
  "MONITOR",
  "OTHER",
];

const STATUSES = [
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "CONVERTED",
];

export default function ServiceRequestsClient({
  user,
  initialRequests,
  initialError,
}: Props) {
  const [requests, setRequests] =
    useState(initialRequests);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [showCreate, setShowCreate] =
    useState(false);

  const [selected, setSelected] =
    useState<ServiceRequestItem | null>(
      null
    );

  const [error, setError] =
    useState(initialError || "");

  const [success, setSuccess] =
    useState("");

  const filteredRequests =
    useMemo(() => {
      const query =
        search.toLowerCase().trim();

      return requests.filter(
        (request) => {
          const matchesSearch =
            !query ||
            request.customerName
              .toLowerCase()
              .includes(query) ||
            request.phone
              .toLowerCase()
              .includes(query) ||
            request.requestNumber
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "ALL" ||
            request.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      requests,
      search,
      statusFilter,
    ]);

  async function handleDelete(
    id: string
  ) {
    if (
      !window.confirm(
        "Delete this service request?"
      )
    ) {
      return;
    }

    const result =
      await deleteServiceRequestAction(
        id
      );

    if (result.error) {
      setError(result.error);
      return;
    }

    setRequests((current) =>
      current.filter(
        (item) =>
          item.id !== id
      )
    );
    setSuccess("Service request deleted successfully.");
  }

  async function handleStatus(
    id: string,
    status: string
  ) {
    const result =
      await updateServiceRequestStatusAction(
        id,
        status
      );

    if (result.error) {
      setError(result.error);
      return;
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
            }
          : item
      )
    );
    setSuccess(`Request marked ${formatLabel(status).toLowerCase()}.`);
  }

  return (
    <div className="staff-dashboard">

      <DashboardSidebar user={user} />

      <div className="dashboard-main">

        <DashboardHeader user={user} />

        <main className="dashboard-content">

          <PageHeader
            title="Service Requests"
            description="Review and manage incoming repair requests."
            buttonText="New request"
            onClick={() =>
              setShowCreate(true)
            }
          />

          <Toast message={error} tone="error" onClose={() => setError("")} />
          <Toast message={success} onClose={() => setSuccess("")} />

          <div className="dashboard-card">

            <div className="page-toolbar">

              <div className="search-box">
                <Search size={17} />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search requests..."
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="page-select"
              >
                <option value="ALL">
                  All statuses
                </option>

                {STATUSES.map(
                  (status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {formatLabel(status)}
                    </option>
                  )
                )}
              </select>

            </div>

            <div className="overflow-x-auto">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Device</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredRequests.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="table-empty"
                      >
                        No service requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(
                      (request) => (
                        <tr
                          key={request.id}
                        >
                          <td>
                            <strong>
                              {request.requestNumber ||
                                request.id.slice(
                                  0,
                                  8
                                )}
                            </strong>
                          </td>

                          <td>
                            {request.customerName}
                          </td>

                          <td>
                            {request.phone}
                          </td>

                          <td>
                            {formatLabel(
                              request.deviceType
                            )}
                          </td>

                          <td>
                            <select
                              className={`inline-status ${getStatusClass(
                                request.status
                              )}`}
                              value={
                                request.status
                              }
                              onChange={(event) =>
                                handleStatus(
                                  request.id,
                                  event.target
                                    .value
                                )
                              }
                            >
                              {STATUSES.map(
                                (status) => (
                                  <option
                                    key={status}
                                    value={status}
                                  >
                                    {formatLabel(
                                      status
                                    )}
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          <td>
                            {formatDate(
                              request.createdAt
                            )}
                          </td>

                          <td>
                            <div className="table-actions">

                              <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                  setSelected(
                                    request
                                  )
                                }
                                title="View"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>

                              <button
                                type="button"
                                className="icon-button danger"
                                onClick={() =>
                                  handleDelete(
                                    request.id
                                  )
                                }
                                title="Delete"
                              >
                                <Trash2
                                  size={16}
                                />
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

      {showCreate && (
        <CreateRequestModal
          onClose={() =>
            setShowCreate(false)
          }
          onCreated={(request) => {
            setRequests((current) => [
              request,
              ...current,
            ]);

            setShowCreate(false);
            setSuccess("Service request created successfully.");
          }}
        />
      )}

      {selected && (
        <RequestDetailsModal
          request={selected}
          onClose={() =>
            setSelected(null)
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  title,
  description,
  buttonText,
  onClick,
}: {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) {
  return (
    <div className="dashboard-welcome">

      <div>

        <p className="dashboard-kicker">
          FIXDESK OPERATIONS
        </p>

        <h1>{title}</h1>

        <p>{description}</p>

      </div>

      <button
        type="button"
        className="new-repair-button"
        onClick={onClick}
      >
        <Plus size={16} />
        {buttonText}
      </button>

    </div>
  );
}

/* =========================================================
   CREATE MODAL
========================================================= */

function CreateRequestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (
    request: ServiceRequestItem
  ) => void;
}) {
  const [form, setForm] =
    useState({
      customerName: "",
      phone: "",
      email: "",
      deviceType: "LAPTOP",
      brand: "",
      model: "",
      serialNumber: "",
      problemDescription: "",
      additionalNotes: "",
      preferredContact: "PHONE",
    });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  function update(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !form.customerName.trim() ||
      !form.phone.trim() ||
      !form.problemDescription.trim()
    ) {
      setError(
        "Customer name, phone and problem description are required."
      );
      return;
    }

    setSaving(true);
    setError("");

    const result =
      await createServiceRequestAction(
        form
      );

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    if (result.request) {
      onCreated(result.request);
    }
  }

  return (
    <div className="modal-overlay">

      <div className="modal-card">

        <div className="modal-header">

          <div>
            <p className="dashboard-kicker">
              NEW REQUEST
            </p>

            <h2>
              Create service request
            </h2>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <form
          onSubmit={submit}
          className="form-grid"
        >

          <FormField
            label="Customer name"
            value={form.customerName}
            onChange={(value) =>
              update(
                "customerName",
                value
              )
            }
            required
          />

          <FormField
            label="Phone"
            value={form.phone}
            onChange={(value) =>
              update(
                "phone",
                value
              )
            }
            required
          />

          <FormField
            label="Email"
            value={form.email}
            onChange={(value) =>
              update(
                "email",
                value
              )
            }
            type="email"
          />

          <div className="form-field">
            <label>Device type</label>

            <select
              value={form.deviceType}
              onChange={(event) =>
                update(
                  "deviceType",
                  event.target.value
                )
              }
            >
              {DEVICE_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {formatLabel(type)}
                  </option>
                )
              )}
            </select>
          </div>

          <FormField
            label="Brand"
            value={form.brand}
            onChange={(value) =>
              update(
                "brand",
                value
              )
            }
          />

          <FormField
            label="Model"
            value={form.model}
            onChange={(value) =>
              update(
                "model",
                value
              )
            }
          />

          <FormField
            label="Serial number"
            value={form.serialNumber}
            onChange={(value) =>
              update(
                "serialNumber",
                value
              )
            }
          />

          <div className="form-field">
            <label>
              Preferred contact
            </label>

            <select
              value={
                form.preferredContact
              }
              onChange={(event) =>
                update(
                  "preferredContact",
                  event.target.value
                )
              }
            >
              <option value="PHONE">
                Phone
              </option>

              <option value="EMAIL">
                Email
              </option>

              <option value="WHATSAPP">
                WhatsApp
              </option>
            </select>
          </div>

          <div className="form-field form-field-full">
            <label>
              Problem description *
            </label>

            <textarea
              value={
                form.problemDescription
              }
              onChange={(event) =>
                update(
                  "problemDescription",
                  event.target.value
                )
              }
              rows={4}
              required
            />
          </div>

          <div className="form-field form-field-full">
            <label>
              Additional notes
            </label>

            <textarea
              value={
                form.additionalNotes
              }
              onChange={(event) =>
                update(
                  "additionalNotes",
                  event.target.value
                )
              }
              rows={3}
            />
          </div>

          <div className="modal-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Create request"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

/* =========================================================
   DETAILS MODAL
========================================================= */

function RequestDetailsModal({
  request,
  onClose,
}: {
  request: ServiceRequestItem;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay">

      <div className="modal-card">

        <div className="modal-header">

          <div>

            <p className="dashboard-kicker">
              SERVICE REQUEST
            </p>

            <h2>
              {request.requestNumber ||
                request.id}
            </h2>

          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>

        <div className="details-grid">

          <Detail
            label="Customer"
            value={
              request.customerName
            }
          />

          <Detail
            label="Phone"
            value={
              request.phone
            }
          />

          <Detail
            label="Email"
            value={
              request.email ||
              "—"
            }
          />

          <Detail
            label="Device"
            value={[
              request.brand,
              request.model,
            ]
              .filter(Boolean)
              .join(" ") ||
              formatLabel(
                request.deviceType
              )}
          />

          <Detail
            label="Serial number"
            value={
              request.serialNumber ||
              "—"
            }
          />

          <Detail
            label="Preferred contact"
            value={formatLabel(
              request.preferredContact
            )}
          />

          <div className="detail-full">
            <Detail
              label="Problem"
              value={
                request.problemDescription
              }
            />
          </div>

          <div className="detail-full">
            <Detail
              label="Additional notes"
              value={
                request.additionalNotes ||
                "—"
              }
            />
          </div>

          <div className="detail-full">
            <Detail
              label="Review notes"
              value={
                request.reviewNotes ||
                "—"
              }
            />
          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="form-field">

      <label>
        {label}
        {required && " *"}
      </label>

      <input
        type={type}
        value={value}
        required={required}
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
    <div className="detail-item">

      <span>{label}</span>

      <strong>
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatLabel(
  value: string
) {
  return String(value).replace(
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

function getStatusClass(
  status: string
) {
  switch (
    String(status).toUpperCase()
  ) {
    case "APPROVED":
    case "CONVERTED":
      return "status-success";

    case "PENDING_REVIEW":
      return "status-warning";

    case "REJECTED":
      return "status-danger";

    default:
      return "status-neutral";
  }
}