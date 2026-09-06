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
} from "lucide-react";

import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";
import Toast from "@/components/toast";

import type { User } from "@/lib/types";

import {
  createCustomerAction,
  updateCustomerAction,
  deleteCustomerAction,
  type CustomerItem,
} from "./actions";

type Props = {
  user: User;
  initialCustomers: CustomerItem[];
  initialError?: string;
};

export default function CustomersClient({
  user,
  initialCustomers,
  initialError,
}: Props) {
  const [customers, setCustomers] =
    useState(initialCustomers);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState(initialError || "");

  const [editing, setEditing] =
    useState<CustomerItem | null>(null);

  const [viewing, setViewing] =
    useState<CustomerItem | null>(null);

  const [creating, setCreating] =
    useState(false);

  const filtered = useMemo(() => {
    const query = search
      .toLowerCase()
      .trim();

    if (!query) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name
          .toLowerCase()
          .includes(query) ||
        customer.phone
          .toLowerCase()
          .includes(query) ||
        customer.email
          ?.toLowerCase()
          .includes(query) ||
        customer.city
          ?.toLowerCase()
          .includes(query)
    );
  }, [customers, search]);

  async function remove(id: string) {
    if (
      !window.confirm(
        "Delete this customer?"
      )
    ) {
      return;
    }

    const result =
      await deleteCustomerAction(id);

    if (result.error) {
      setError(result.error);
      return;
    }

    setCustomers((current) =>
      current.filter(
        (customer) =>
          customer.id !== id
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
              PAGE HEADER
          ===================================================== */}

          <div className="dashboard-welcome">

            <div>
              <p className="dashboard-kicker">
                CUSTOMER MANAGEMENT
              </p>

              <h1>
                Customers
              </h1>

              <p>
                Manage your repair shop customers
                and contact details.
              </p>
            </div>

            <div className="customer-header-actions">

              {/* Search */}
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
                  placeholder="Search customers..."
                  aria-label="Search customers"
                />

              </div>

              {/* Add */}
              <button
                type="button"
                className="new-repair-button"
                onClick={() =>
                  setCreating(true)
                }
              >
                <Plus size={16} />
                Add customer
              </button>

            </div>

          </div>

          {/* =====================================================
              ERROR
          ===================================================== */}

          <Toast message={error} tone="error" onClose={() => setError("")} />

          {/* =====================================================
              CUSTOMER TABLE
          ===================================================== */}

          <div className="dashboard-card customer-table-card">

            <div className="customer-table-toolbar">

              <span className="toolbar-count">
                {filtered.length}{" "}
                {filtered.length === 1
                  ? "customer"
                  : "customers"}
              </span>

            </div>

            <div className="overflow-x-auto">

              <table className="data-table">

                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filtered.length === 0 ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="customer-empty-cell"
                      >
                        <div className="customer-empty">

                          <div className="customer-empty-icon">
                            <UsersIcon />
                          </div>

                          <h3>
                            {search.trim()
                              ? "No customers found"
                              : "No customers found."}
                          </h3>

                          <p>
                            {search.trim()
                              ? "Try a different search term."
                              : "Add your first customer to get started."}
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
                              Add customer
                            </button>
                          )}

                        </div>
                      </td>
                    </tr>

                  ) : (

                    filtered.map(
                      (customer) => (

                        <tr
                          key={
                            customer.id
                          }
                        >

                          <td>
                            <strong>
                              {
                                customer.name
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              customer.phone
                            }
                          </td>

                          <td>
                            {
                              customer.email ||
                              "—"
                            }
                          </td>

                          <td>
                            {
                              customer.city ||
                              "—"
                            }
                          </td>

                          <td>
                            {formatDate(
                              customer.createdAt
                            )}
                          </td>

                          <td>

                            <div className="table-actions">

                              <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                  setViewing(
                                    customer
                                  )
                                }
                                title="View customer"
                                aria-label="View customer"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-button"
                                onClick={() =>
                                  setEditing(
                                    customer
                                  )
                                }
                                title="Edit customer"
                                aria-label="Edit customer"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                className="icon-button danger"
                                onClick={() =>
                                  remove(
                                    customer.id
                                  )
                                }
                                title="Delete customer"
                                aria-label="Delete customer"
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
          CREATE / EDIT CUSTOMER DRAWER
      ===================================================== */}

      {(creating || editing) && (
        <CustomerModal
          customer={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(customer) => {

            setCustomers((current) => {

              const exists =
                current.some(
                  (item) =>
                    item.id ===
                    customer.id
                );

              if (exists) {
                return current.map(
                  (item) =>
                    item.id ===
                    customer.id
                      ? customer
                      : item
                );
              }

              return [
                customer,
                ...current,
              ];
            });

            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {/* =====================================================
          CUSTOMER DETAILS
      ===================================================== */}

      {viewing && (
        <CustomerDetails
          customer={viewing}
          onClose={() =>
            setViewing(null)
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   ADD / EDIT CUSTOMER DRAWER
========================================================= */

function CustomerModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerItem | null;
  onClose: () => void;
  onSaved: (
    customer: CustomerItem
  ) => void;
}) {
  const [form, setForm] =
    useState({
      name:
        customer?.name || "",
      phone:
        customer?.phone || "",
      email:
        customer?.email || "",
      address:
        customer?.address || "",
      city:
        customer?.city || "",
      notes:
        customer?.notes || "",
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
      !form.name.trim() ||
      !form.phone.trim()
    ) {
      setError(
        "Name and phone are required."
      );
      return;
    }

    setSaving(true);
    setError("");

    const result = customer
      ? await updateCustomerAction(
          customer.id,
          form
        )
      : await createCustomerAction(
          form
        );

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    if (result.customer) {
      onSaved(
        result.customer
      );
    }
  }

  return (
    <div className="customer-drawer-overlay">

      <aside className="customer-drawer">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="customer-drawer-header">

          <div>

            <p className="dashboard-kicker">
              CUSTOMER
            </p>

            <h2>
              {customer
                ? "Edit customer"
                : "Add customer"}
            </h2>

            <p className="customer-drawer-subtitle">
              {customer
                ? "Update customer information."
                : "Add a new customer to your repair shop."}
            </p>

          </div>

          <button
            type="button"
            className="customer-drawer-close"
            onClick={onClose}
            aria-label="Close customer form"
          >
            <X size={20} />
          </button>

        </div>

        {/* =====================================================
            FORM
        ===================================================== */}

        <form
          onSubmit={submit}
          className="customer-form"
        >

          {error && (
            <div className="customer-form-error">
              {error}
            </div>
          )}

          {/* Name + Phone */}

          <div className="customer-form-row">

            <FormField
              label="Name"
              value={form.name}
              onChange={(value) =>
                update(
                  "name",
                  value
                )
              }
              placeholder="Enter customer name"
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
              placeholder="Enter phone number"
              required
            />

          </div>

          {/* Email + City */}

          <div className="customer-form-row">

            <FormField
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) =>
                update(
                  "email",
                  value
                )
              }
              placeholder="Enter email address"
            />

            <FormField
              label="City"
              value={form.city}
              onChange={(value) =>
                update(
                  "city",
                  value
                )
              }
              placeholder="Enter city"
            />

          </div>

          {/* Address */}

          <div className="customer-form-field customer-form-full">

            <label>
              Address
            </label>

            <textarea
              rows={4}
              value={form.address}
              onChange={(event) =>
                update(
                  "address",
                  event.target.value
                )
              }
              placeholder="Enter full address"
            />

          </div>

          {/* Notes */}

          <div className="customer-form-field customer-form-full">

            <label>
              Notes
            </label>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) =>
                update(
                  "notes",
                  event.target.value
                )
              }
              placeholder="Add notes (optional)"
            />

          </div>

          {/* Buttons */}

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
                : customer
                ? "Save changes"
                : "Create customer"}
            </button>

          </div>

        </form>

      </aside>

    </div>
  );
}

/* =========================================================
   CUSTOMER DETAILS
========================================================= */

function CustomerDetails({
  customer,
  onClose,
}: {
  customer: CustomerItem;
  onClose: () => void;
}) {
  return (
    <div className="customer-drawer-overlay">

      <aside className="customer-drawer">

        <div className="customer-drawer-header">

          <div>

            <p className="dashboard-kicker">
              CUSTOMER
            </p>

            <h2>
              {customer.name}
            </h2>

            <p className="customer-drawer-subtitle">
              Customer details
            </p>

          </div>

          <button
            type="button"
            className="customer-drawer-close"
            onClick={onClose}
            aria-label="Close customer details"
          >
            <X size={20} />
          </button>

        </div>

        <div className="customer-details">

          <Detail
            label="Phone"
            value={
              customer.phone
            }
          />

          <Detail
            label="Email"
            value={
              customer.email ||
              "—"
            }
          />

          <Detail
            label="City"
            value={
              customer.city ||
              "—"
            }
          />

          <Detail
            label="Created"
            value={formatDate(
              customer.createdAt
            )}
          />

          <div className="customer-detail-full">

            <Detail
              label="Address"
              value={
                customer.address ||
                "—"
              }
            />

          </div>

          <div className="customer-detail-full">

            <Detail
              label="Notes"
              value={
                customer.notes ||
                "—"
              }
            />

          </div>

        </div>

      </aside>

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
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
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

      <input
        type={type}
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

/* =========================================================
   EMPTY STATE ICON
========================================================= */

function UsersIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/* =========================================================
   DATE
========================================================= */

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