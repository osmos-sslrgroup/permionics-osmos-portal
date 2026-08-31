import React from 'react';
import { Section, Question } from '@/types/questionnaire';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { QuestionRow } from './QuestionRow';
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

interface SectionBlockProps {
  section: Section;
  questions: Question[];
  onUpdateSection: (id: string, updates: Partial<Section>) => void;
  onDeleteSection: (id: string) => void;
  onAddQuestion: (sectionId: string) => void;

  // Question handlers
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onDeleteQuestion: (id: string) => void;
  onMoveQuestionUp: (id: string) => void;
  onMoveQuestionDown: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
}

export function SectionBlock({
  section,
  questions,
  onUpdateSection,
  onDeleteSection,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  onMoveQuestionUp,
  onMoveQuestionDown,
  onDragStart,
  onDragOver,
  onDrop
}: SectionBlockProps) {
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleValue, setTitleValue] = React.useState(section.title);

  const toggleExpanded = () => {
    onUpdateSection(section.id, { isExpanded: !section.isExpanded });
  };

  const handleTitleSubmit = () => {
    if (titleValue.trim()) {
      onUpdateSection(section.id, { title: titleValue.trim() });
    } else {
      setTitleValue(section.title);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setTitleValue(section.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden mb-6">
      <div className="bg-secondary/30 flex items-center justify-between p-2 pl-3 border-b border-border group">
        <div className="flex items-center gap-2 flex-1">
          <button
            type="button"
            onClick={toggleExpanded}
            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
          >
            {section.isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {isEditingTitle ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
              className="h-8 py-1 text-sm font-semibold max-w-sm"
              autoFocus
            />
          ) : (
            <h3
              className="text-sm font-semibold text-primary cursor-pointer hover:underline decoration-primary/30 underline-offset-4"
              onClick={() => setIsEditingTitle(true)}
            >
              {section.title}
            </h3>
          )}
          <span className="text-xs text-muted-foreground ml-2">
            ({questions.length} question{questions.length !== 1 ? 's' : ''})
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this section and all its questions? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteSection(section.id)} className="bg-destructive hover:bg-destructive/90 text-white">
                  Delete Section
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {section.isExpanded && (
        <div className="p-4 space-y-3 bg-muted/5">
          {questions.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-md bg-card">
              <p className="text-sm text-muted-foreground">No questions in this section.</p>
            </div>
          ) : (
            questions.map((q, idx) => (
              <QuestionRow
                key={q.id}
                question={q}
                index={idx}
                totalQuestions={questions.length}
                onUpdate={onUpdateQuestion}
                onDelete={onDeleteQuestion}
                onMoveUp={onMoveQuestionUp}
                onMoveDown={onMoveQuestionDown}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            ))
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddQuestion(section.id)}
              className="w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary/50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question to Section
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
