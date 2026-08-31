import { Switch, Route, useRoute } from "wouter";
import ProjectsPage from "./ProjectsPage";
import EditorPage from "./EditorPage";

export default function GeneratorApp() {
  const [isEditorMatch, editorParams] = useRoute("/editor/:id");

  if (isEditorMatch && editorParams) {
    return <EditorPage projectId={Number(editorParams.id)} />;
  }

  return (
    <Switch>
      <Route path="/" component={ProjectsPage} />
      <Route path="" component={ProjectsPage} />
    </Switch>
  );
}
