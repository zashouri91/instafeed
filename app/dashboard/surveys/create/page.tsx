"use client";

import { SurveyGenerator } from "@/components/email-survey/survey-generator";

export default function CreateSurveyPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create Email Signature Survey</h1>
      </div>
      <SurveyGenerator />
    </div>
  );
}
