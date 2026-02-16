import React from "react";
import { Provider } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";

import store from "./skote/js/store";
import "./skote/js/i18n";

import "./skote/scss/app.scss";
import "./skote/scss/icons.scss";

import VerticalLayout from "./skote/js/components/VerticalLayout";
import Dashboard from "./skote/js/pages/Dashboard";

function Shell({ children }) {
  return <VerticalLayout>{children}</VerticalLayout>;
}

export default function SkoteAdminEntry() {
  return (
    <Provider store={store}>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Shell>
              <Dashboard />
            </Shell>
          }
        />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </Provider>
  );
}
