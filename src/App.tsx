import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

// Pages
import NationalGrid from './pages/NationalGrid';
import RegionalFacilities from './pages/RegionalFacilities';
import PipelineDecision from './pages/PipelineDecision';
import PipelineTimeSeries from './pages/PipelineTimeSeries';
import EnterpriseReporting from './pages/EnterpriseReporting';
import WorkflowAttribution from './pages/WorkflowAttribution';
import KnowledgeGraph from './pages/KnowledgeGraph';
import EventAuditSla from './pages/EventAuditSla';
import EventAudit from './pages/EventAudit';
import ReportGeneration from './pages/ReportGeneration';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/sensing/national-grid" replace />} />
          
          <Route path="sensing">
            <Route path="national-grid" element={<NationalGrid />} />
            <Route path="regional/:regionId" element={<RegionalFacilities />} />
            {/* 1.3 is technically part of 1.2 drawer, but route helps for direct access */}
            <Route path="facility/:facilityId" element={<RegionalFacilities />} />
          </Route>

          <Route path="warning">
            <Route path="timeseries" element={<PipelineDecision />} />
            <Route path="timeseries/:anomalyId" element={<PipelineDecision />} />
            <Route path="timeseries/:anomalyId/diagnostics" element={<PipelineTimeSeries />} />
            <Route path="enterprise" element={<EnterpriseReporting />} />
            <Route path="enterprise/:entId" element={<EnterpriseReporting />} />
          </Route>

          <Route path="attribution">
            <Route path="workflow" element={<WorkflowAttribution />} />
            <Route path="workflow/:caseId" element={<WorkflowAttribution />} />
            <Route path="graph" element={<KnowledgeGraph />} />
            <Route path="graph/:focusId" element={<KnowledgeGraph />} />
          </Route>

          <Route path="audit">
            <Route path="event/:caseId" element={<EventAuditSla />} />
            <Route path="event/:caseId/matrix" element={<EventAudit />} />
            <Route path="report" element={<ReportGeneration />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
