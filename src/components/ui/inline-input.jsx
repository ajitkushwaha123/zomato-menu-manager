"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function InlineInput({
    placeholder,
    onSubmit,
    onCancel,
    autoFocus = true,
}) {
    const [value, setValue] = useState("");

    const handleSubmit = () => {
        const name = value.trim();

        if (!name) return;

        onSubmit(name);
        setValue("");
    };

    return (
        <Input
            autoFocus={autoFocus}
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
                if (!value.trim()) {
                    onCancel?.();
                }
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    handleSubmit();
                }

                if (e.key === "Escape") {
                    setValue("");
                    onCancel?.();
                }
            }}
        />
    );
}