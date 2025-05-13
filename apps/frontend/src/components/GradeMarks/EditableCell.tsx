import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface EditableCellProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number";
  className?: string;
  max?: number;
  disabled?: boolean;
}

export const EditableCell = ({ 
  value, 
  onChange, 
  type = "text", 
  className = "",
  max,
  disabled = false
}: EditableCellProps) => {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = () => {
    if (!disabled) {
      setEditing(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue: string | number = e.target.value;
    
    if (type === "number") {
      if (newValue === "") {
        newValue = 0;
      } else {
        newValue = parseFloat(newValue);
        if (isNaN(newValue)) {
          newValue = 0;
        }
        if (max !== undefined && typeof newValue === "number" && newValue > max) {
          newValue = max;
        }
      }
    }
    
    setInputValue(newValue);
  };

  const handleBlur = () => {
    commitChanges();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitChanges();
    } else if (e.key === "Escape") {
      setEditing(false);
      setInputValue(value);
    }
  };

  const commitChanges = () => {
    setEditing(false);
    onChange(inputValue);
  };

  return (
    <div 
      className={cn(
        "min-h-[24px] w-full py-1 px-2   rounded",
        disabled ? "cursor-default" : "cursor-text",
        editing ? "bg-blue-50" : "",
        className
      )}
      onDoubleClick={handleDoubleClick}
    >
      {editing ? (
        <input
          ref={inputRef}
          type={type}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-white border border-blue-400 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          max={max}
        />
      ) : (
        <div className="min-h-[24px]">{value}</div>
      )}
    </div>
  );
};

export default EditableCell;
