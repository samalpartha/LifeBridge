"use client";

import React, { useState, useEffect, useRef } from "react";

interface VoiceRecorderProps {
    onTranscriptChange: (text: string) => void;
    initialText?: string;
}

export function VoiceRecorder({ onTranscriptChange, initialText = "" }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState(initialText);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        setTranscript(initialText);
    }, [initialText]);

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
                let interimTranscript = "";
                let finalTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    const newText = transcript + (transcript && !transcript.endsWith(" ") ? " " : "") + finalTranscript;
                    setTranscript(newText);
                    onTranscriptChange(newText);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }
    }, [transcript, onTranscriptChange]);

    const toggleRecording = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            recognitionRef.current?.start();
            setIsRecording(true);
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setTranscript(newText);
        onTranscriptChange(newText);
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                    Your Story (Voice or Text)
                </label>
                <button
                    onClick={toggleRecording}
                    className={`btn btn-sm ${isRecording ? "btn-error animate-pulse" : "btn-outline"}`}
                    type="button"
                >
                    {isRecording ? (
                        <>
                            <span className="w-2 h-2 bg-white rounded-full mr-2"></span>
                            Recording...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            Start Recording
                        </>
                    )}
                </button>
            </div>
            <textarea
                value={transcript}
                onChange={handleTextChange}
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                placeholder="Type or record your situation here..."
            />
        </div>
    );
}
