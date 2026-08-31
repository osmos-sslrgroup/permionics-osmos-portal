import React, { useRef, useState } from 'react';
import { Question, QuestionType } from '@/types/questionnaire';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GripVertical, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface QuestionRowProps {
  question: Question;
  index: number;
  totalQuestions: number;
  onUpdate: (id: string, updates: Partial<Question>) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

export function QuestionRow({
  question,
  index,
  totalQuestions,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop
}: QuestionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleEditStart = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = inputRef.current.value.length;
      }
    }, 0);
  };

  const handleEditEnd = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditEnd();
    }
    if (e.key === 'Escape') {
      handleEditEnd();
    }
  };

  return (
    <div
      className="flex items-start gap-3 p-3 bg-card border border-border rounded-md hover:border-primary/40 transition-colors group relative"
      draggable
      onDragStart={(e) => onDragStart(e, question.id)}
      onDragOver={(e) => onDragOver(e, question.id)}
      onDrop={(e) => onDrop(e, question.id)}
    >
      <div className="flex flex-col items-center gap-1 mt-1 text-muted-foreground/50 group-hover:text-muted-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onMoveUp(question.id)}
            disabled={index === 0}
            className="disabled:opacity-20 hover:text-primary transition-colors"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(question.id)}
            disabled={index === totalQuestions - 1}
            className="disabled:opacity-20 hover:text-primary transition-colors"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-muted-foreground mt-0.5 whitespace-nowrap">
            Q{question.number}.
          </span>
          <div className="flex-1">
            {isEditing ? (
              <textarea
                ref={inputRef}
                value={question.text}
                onChange={(e) => onUpdate(question.id, { text: e.target.value })}
                onBlur={handleEditEnd}
                onKeyDown={handleKeyDown}
                className="w-full text-sm min-h-[40px] p-1.5 border border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary rounded resize-none overflow-hidden"
                style={{ height: 'auto', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            ) : (
              <p
                className="text-sm text-foreground cursor-text hover:bg-secondary/30 p-1.5 -ml-1.5 rounded transition-colors"
                onClick={handleEditStart}
              >
                {question.text}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap mt-1">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground font-normal">Type:</Label>
            <Select
              value={question.type}
              onValueChange={(value: QuestionType) => onUpdate(question.id, { type: value })}
            >
              <SelectTrigger className="h-7 text-xs w-[120px] bg-secondary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Text">Text</SelectItem>
                <SelectItem value="Number">Number</SelectItem>
                <SelectItem value="Choice">Choice</SelectItem>
                <SelectItem value="Table">Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id={`req-${question.id}`}
              checked={question.required}
              onCheckedChange={(checked) => onUpdate(question.id, { required: checked })}
              className="scale-75 data-[state=checked]:bg-primary"
            />
            <Label htmlFor={`req-${question.id}`} className="text-xs font-normal text-muted-foreground cursor-pointer">
              Required
            </Label>
          </div>
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this question? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(question.id)} className="bg-destructive hover:bg-destructive/90 text-white">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
