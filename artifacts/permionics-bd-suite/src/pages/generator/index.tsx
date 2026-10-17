import { Switch, Route, useRoute } from "wouter";
import ProjectsPage from "./ProjectsPage";
import EditorPage from "./EditorPage";

export default function GeneratorApp() {
  const [isEditorMatch, editorParams] = useRoute("/editor/:id");
  const [isLibraryMatch, libraryParams] = useRoute("/library/:id");

  if (isEditorMatch && editorParams) {
    return <EditorPage projectId={Number(editorParams.id)} mode="creator" />;
  }

  if (isLibraryMatch && libraryParams) {
    return <EditorPage projectId={Number(libraryParams.id)} mode="library" />;
  }

  return (
    <Switch>
      <Route path="/" component={ProjectsPage} />
      <Route path="" component={ProjectsPage} />
    </Switch>
  );
}
