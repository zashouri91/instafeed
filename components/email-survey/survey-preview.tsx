"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SurveyPreviewProps {
  data: {
    id: string;
    name: string;
    title: string;
    email: string;
    mobile: string;
    address: string;
    state: string;
    country: string;
    website: string;
    photo_url?: string;
    linkedin_url?: string;
  };
  className?: string;
}

export function SurveyPreview({ data, className }: SurveyPreviewProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleRating = async (rating: number) => {
    if (submitted) return;
    
    try {
      const response = await fetch(`/api/surveys/${data.id}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) throw new Error("Failed to submit rating");

      setSelectedRating(rating);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  return (
    <div className={cn("max-w-xl p-4 font-sans", className)}>
      <div className="flex items-start gap-4">
        {data.photo_url && (
          <div className="flex-shrink-0">
            <Image
              src={data.photo_url}
              alt={data.name}
              width={80}
              height={80}
              className="rounded-full"
            />
          </div>
        )}
        
        <div className="flex-1 space-y-2">
          <div>
            <h3 className="font-bold text-lg text-[#00A36C]">{data.name}</h3>
            <p className="text-gray-600">{data.title}</p>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>Email: {data.email}</p>
            <p>Mobile: {data.mobile}</p>
            <p>{data.address}, {data.state}</p>
            <p>{data.country}</p>
            <a href={`https://${data.website}`} className="text-[#00A36C] hover:underline">
              {data.website}
            </a>
          </div>

          {data.linkedin_url && (
            <div className="flex gap-2 mt-2">
              <a href={data.linkedin_url} target="_blank" rel="noopener noreferrer">
                <div className="w-6 h-6 bg-[#00A36C] rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
              </a>
            </div>
          )}
          
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">How did I do?</p>
            <div className="flex gap-2">
              {[1, 2, 3].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  disabled={submitted}
                  className={cn(
                    "transition-colors",
                    submitted && selectedRating !== rating ? "opacity-50" : ""
                  )}
                >
                  <svg className="w-8 h-8" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill={rating === 1 ? "#ff4d4d" : rating === 2 ? "#ffd700" : "#00A36C"}
                    />
                    <path
                      d="M50 25C37.3 25 27 35.3 27 48c0 12.7 10.3 23 23 23s23-10.3 23-23c0-12.7-10.3-23-23-23zm0 42c-10.5 0-19-8.5-19-19s8.5-19 19-19 19 8.5 19 19-8.5 19-19 19z"
                      fill="white"
                    />
                    {rating === 1 ? (
                      <>
                        <circle cx="40" cy="45" r="3" fill="white" />
                        <circle cx="60" cy="45" r="3" fill="white" />
                        <path d="M35 60c0 0 6-5 15-5s15 5 15 5" stroke="white" strokeWidth="2" fill="none" transform="rotate(180 50 60)" />
                      </>
                    ) : rating === 2 ? (
                      <>
                        <circle cx="40" cy="45" r="3" fill="white" />
                        <circle cx="60" cy="45" r="3" fill="white" />
                        <path d="M35 58h30" stroke="white" strokeWidth="2" fill="none" />
                      </>
                    ) : (
                      <>
                        <circle cx="40" cy="45" r="3" fill="white" />
                        <circle cx="60" cy="45" r="3" fill="white" />
                        <path d="M35 60c0 0 6-5 15-5s15 5 15 5" stroke="white" strokeWidth="2" fill="none" />
                      </>
                    )}
                  </svg>
                </button>
              ))}
            </div>
            <a
              href="#"
              className="text-xs text-[#00A36C] hover:underline block mt-2"
            >
              Click on a face to provide feedback on my performance!
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
