import { AuthPanel } from "./features/AuthPanel.tsx";
import { ListsPanel } from "./features/ListsPanel.tsx";
import { TasksPanel } from "./features/TasksPanel.tsx";
import { actions, store } from "./state/app.ts";

export function App() {
  const state = store.useStore();

  if (!state.ready) return <p className="loading">Loading…</p>;
  if (!state.user) return <AuthPanel />;

  const activeList = state.lists.find((list) => list.id === state.activeListId);

  return (
    <>
      <header className="bar">
        <strong>Task manager</strong>
        <span>
          <span className="who">{state.user.username}</span>{" "}
          <button className="link" onClick={() => void actions.signOut()}>
            Sign out
          </button>
        </span>
      </header>

      <div className="layout">
        <ListsPanel lists={state.lists} activeListId={state.activeListId} />
        <TasksPanel
          list={activeList}
          tasks={state.tasks}
          nextCursor={state.nextCursor}
          filters={state.filters}
          error={state.error}
        />
      </div>
    </>
  );
}
