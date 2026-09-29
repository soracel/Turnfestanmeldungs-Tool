import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import type { SessionController } from '../../application/session/controller';
import type { ImportInput } from '../../application/ports/browser';
export interface AppServices {
  readonly controller: SessionController;
  readonly demoInput: ImportInput;
  readonly fileInput: (file: File) => ImportInput;
}
const Context = createContext<AppServices | null>(null);
export function AppProvider({
  services,
  children,
}: {
  services: AppServices;
  children: ReactNode;
}) {
  return <Context.Provider value={services}>{children}</Context.Provider>;
}
export function useServices() {
  const services = useContext(Context);
  if (!services) throw new Error('AppProvider is required');
  return services;
}
export function useSession() {
  const { controller } = useServices();
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
}
