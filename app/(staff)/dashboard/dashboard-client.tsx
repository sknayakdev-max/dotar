"use client";

import Link from "next/link";
import { Package, Wrench } from "lucide-react";

import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";

import type {
  DashboardStats,
  User,
} from "@/lib/types";

type Props = {
  user: User;
  initialStats: DashboardStats;
  initialError?: string;
};

export default function DashboardClient({
  user,
  initialStats,
  initialError,
}: Props) {
  const stats = initialStats;

  const normalizedRole =
    String(user.role).toUpperCase();

  const isEmployee = normalizedRole === "EMPLOYEE";

  return (
    <div className="staff-dashboard">

      <DashboardSidebar user={user} />

      <div className="dashboard-main">

        <DashboardHeader user={user} />

        <main className="dashboard-content">

          {/* =================================================
              WELCOME
          ================================================= */}

          <div className="dashboard-welcome">

            <div>

              <p className="dashboard-kicker">
                FIXDESK OPERATIONS
              </p>

              <h1>
                {getDashboardTitle(user.role)}
              </h1>

              <p>
                Here&apos;s what&apos;s happening in your
                repair shop today.
              </p>

            </div>

            {!isEmployee && (
              <Link
                href="/request-service"
                className="new-repair-button"
              >
                <Wrench size={16} />
                New repair
              </Link>
            )}

          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {initialError && (
            <div className="dashboard-card">
              <p className="error-message">
                {initialError}
              </p>
            </div>
          )}

          {/* =================================================
              PRIMARY
          ================================================= */}

          <div className="dashboard-grid dashboard-grid-primary">

            <RecentRepairs
              repairs={stats.recentRepairs}
            />

            <RecentActivity
              activities={stats.recentActivity}
            />

          </div>

          {/* =================================================
              SECONDARY
          ================================================= */}

          {!isEmployee && (
            <div className="dashboard-grid dashboard-grid-secondary">

              <EmployeeWorkload
                employees={stats.employees}
              />

              <LowStock
                items={stats.lowStockItems}
              />

            </div>
          )}

        </main>

      </div>

    </div>
  );
}

/* =========================================================
   RECENT REPAIRS
========================================================= */

function RecentRepairs({
  repairs,
}: {
  repairs: DashboardStats["recentRepairs"];
}) {
  return (
    <div className="dashboard-card dashboard-span-two">

      <div className="dashboard-card-heading">

        <div>

          <p className="dashboard-kicker">
            REPAIR WORKSPACE
          </p>

          <h3>
            Recent repairs
          </h3>

          <span>
            Latest repair activity
          </span>

        </div>

        <Link
          href="/staff/repairs"
          className="dashboard-text-button"
        >
          View all
        </Link>

      </div>

      {repairs.length === 0 ? (

        <p className="dashboard-empty-state">
          No repairs recorded yet.
        </p>

      ) : (

        <div className="overflow-x-auto">

          <table className="data-table">

            <thead>

              <tr>
                <th>Repair</th>
                <th>Customer</th>
                <th>Device</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {repairs.map((repair) => (

                <tr key={repair.id}>

                  <td>
                    {repair.repairNumber ||
                      repair.id}
                  </td>

                  <td>
                    {repair.customerName}
                  </td>

                  <td>
                    {repair.deviceName}
                  </td>

                  <td>
                    <span
                      className={`dashboard-status ${getPriorityClass(
                        repair.priority
                      )}`}
                    >
                      {formatLabel(
                        repair.priority
                      )}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`dashboard-status ${getStatusClass(
                        repair.status
                      )}`}
                    >
                      {formatLabel(
                        repair.status
                      )}
                    </span>
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   RECENT ACTIVITY
========================================================= */

function RecentActivity({
  activities,
}: {
  activities: DashboardStats["recentActivity"];
}) {
  return (
    <div className="dashboard-card dashboard-activity-card">

      <div className="dashboard-card-heading">

        <div>

          <p className="dashboard-kicker">
            LIVE FEED
          </p>

          <h3>
            Recent activity
          </h3>

        </div>

      </div>

      <div className="dashboard-activity-list">

        {activities.length === 0 ? (

          <p className="dashboard-empty-state">
            No activity recorded yet.
          </p>

        ) : (

          activities.map((activity) => (

            <div
              key={activity.id}
              className="dashboard-activity-item"
            >

              <i />

              <div>

                <p>
                  {activity.description ||
                    activity.action}
                </p>

                <span>
                  {formatDate(
                    activity.createdAt
                  )}
                </span>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

/* =========================================================
   EMPLOYEE WORKLOAD
========================================================= */

function EmployeeWorkload({
  employees,
}: {
  employees: DashboardStats["employees"];
}) {
  return (
    <div className="dashboard-card dashboard-support-card">

      <div className="dashboard-card-heading">

        <div>

          <p className="dashboard-kicker">
            TEAM CAPACITY
          </p>

          <h3>
            Employee workload
          </h3>

          <span>
            Current repair assignments
          </span>

        </div>

      </div>

      <div className="dashboard-workload-list">

        {employees.length === 0 ? (

          <p className="dashboard-empty-state">
            No employee assignments yet.
          </p>

        ) : (

          employees.map((employee) => (

            <div key={employee.id}>

              <div className="dashboard-workload-label">

                <strong>
                  {employee.name}
                </strong>

                <span>
                  {employee.repairs} repairs
                </span>

              </div>

              <div className="dashboard-progress-track">

                <div
                  className="dashboard-progress-bar"
                  style={{
                    width: `${Math.min(
                      employee.repairs * 10,
                      100
                    )}%`,
                  }}
                />

              </div>

              <small>
                {employee.active} currently
                in progress
              </small>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

/* =========================================================
   LOW STOCK
========================================================= */

function LowStock({
  items,
}: {
  items: DashboardStats["lowStockItems"];
}) {
  return (
    <div className="dashboard-card dashboard-support-card">

      <div className="dashboard-card-heading">

        <div>

          <p className="dashboard-kicker">
            INVENTORY ALERT
          </p>

          <h3>
            Low stock
          </h3>

          <span>
            Items that need attention
          </span>

        </div>

        <Link
          href="/staff/inventory"
          className="dashboard-text-button"
        >
          View inventory
        </Link>

      </div>

      <div className="dashboard-stock-list">

        {items.length === 0 ? (

          <p className="dashboard-empty-state">
            No inventory alerts.
          </p>

        ) : (

          items.map((item) => (

            <div
              key={item.id}
              className="dashboard-stock-item"
            >

              <div className="dashboard-stock-name">

                <div>
                  <Package size={16} />
                </div>

                <span>
                  {item.partName}
                </span>

              </div>

              <strong>
                {item.quantity} left
              </strong>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatLabel(value: string) {
  return String(value)
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getDashboardTitle(
  role: User["role"]
) {
  const normalizedRole =
    String(role).toUpperCase();

  switch (normalizedRole) {

    case "ADMIN":
    case "SUPER_ADMIN":
      return "Admin Dashboard";

    case "MANAGER":
      return "Manager Dashboard";

    case "EMPLOYEE":
    case "STAFF":
      return "My Dashboard";

    default:
      return "Dashboard";
  }
}

function getStatusClass(status: string) {
  switch (
    String(status).toUpperCase()
  ) {

    case "COMPLETED":
      return "dashboard-status-success";

    case "IN_PROGRESS":
      return "dashboard-status-info";

    case "PENDING":
      return "dashboard-status-warning";

    case "CANCELLED":
      return "dashboard-status-danger";

    default:
      return "dashboard-status-neutral";
  }
}

function getPriorityClass(priority: string) {
  switch (
    String(priority).toUpperCase()
  ) {

    case "URGENT":
      return "dashboard-status-danger";

    case "HIGH":
      return "dashboard-status-warning";

    case "MEDIUM":
      return "dashboard-status-info";

    case "LOW":
      return "dashboard-status-neutral";

    default:
      return "dashboard-status-neutral";
  }
}