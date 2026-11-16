import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { appUrl } from "../config";
import type { JournalActions } from "../journal/Journal";
import { buildView, type JournalView } from "../journal/model";
import { supabase } from "../lib/supabase";
import type { Grade } from "../lib/srs";
import {
  addChronicle,
  addReading,
  addRune,
  adjustItem,
  gradeRune,
  requestEpisode,
  requestSeries,
  saveSettings,
  setQuestStatus,
  toggleHabitToday,
  toggleQuestStep,
  type Mutation,
} from "./mutate";
import { emptyQueue, isNetworkError, loadCache, loadQueue, messageOf, saveCache, saveQueue } from "./offline";
import type { DocMap, OfflineQueue, SavePhase } from "./types";

function overlay(docs: DocMap, queue: OfflineQueue): DocMap {
  return { ...docs, ...queue.docs };
}

export function useJournal() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [docs, setDocs] = useState<DocMap | null>(null);
  const [mode, setMode] = useState<"remote" | "fixture" | null>(null);
  const [phase, setPhase] = useState<SavePhase>("idle");
  const [detail, setDetail] = useState("");
  const [loadError, setLoadError] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [authError, setAuthError] = useState("");

  const docsRef = useRef<DocMap>({});
  const queueRef = useRef<OfflineQueue>(emptyQueue(""));
  const idsRef = useRef<Record<string, string>>({});
  const modeRef = useRef<"remote" | "fixture" | null>(null);
  const emailRef = useRef("");
  const timer = useRef<number | undefined>(undefined);
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const email = session?.user.email || "";
  emailRef.current = modeRef.current === "fixture" ? "fixture" : email;

  useEffect(() => {
    let live = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!live) return;
      setSession(data.session);
      setBooting(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setBooting(false);
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const flush = useCallback(async () => {
    const currentMode = modeRef.current;
    const queue = queueRef.current;
    if (currentMode === "fixture") {
      queue.events = [];
      queue.docs = {};
      saveQueue(queue);
      setPhase("saved");
      setDetail("");
      return;
    }
    const owner = emailRef.current;
    if (!owner || currentMode !== "remote") return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setPhase("queued");
      setDetail("Will sync when you reconnect");
      return;
    }
    if (!queue.events.length && Object.keys(queue.docs).length === 0) return;
    setPhase("saving");
    try {
      const docsAtStart = queue.docs;
      for (const key of Object.keys(docsAtStart)) {
        const snapshot = docsAtStart[key];
        const row: Record<string, unknown> = {
          owner_email: owner,
          key,
          data: snapshot,
          updated_at: new Date().toISOString(),
        };
        if (idsRef.current[key]) row.id = idsRef.current[key];
        const { error } = await supabase.from("qj_docs").upsert(row, { onConflict: "owner_email,key" });
        if (error) throw error;
        if (queue.docs[key] === snapshot) {
          const rest = { ...queue.docs };
          delete rest[key];
          queue.docs = rest;
        }
      }
      const pending = queue.events.slice();
      for (const ev of pending) {
        const { error } = await supabase.from("qj_events").insert({ kind: ev.kind, payload: ev.payload });
        if (error) throw error;
        queue.events = queue.events.filter((item) => item.id !== ev.id);
        saveQueue(queue);
      }
      saveQueue(queue);
      if (!queue.events.length && Object.keys(queue.docs).length === 0) {
        setPhase("saved");
        setDetail("");
      } else {
        window.setTimeout(() => void flushRef.current(), 400);
      }
    } catch (error) {
      saveQueue(queue);
      if (isNetworkError(error)) {
        setPhase("queued");
        setDetail("Will sync when you reconnect");
      } else {
        setPhase("error");
        setDetail(messageOf(error));
      }
    }
  }, []);

  flushRef.current = flush;

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flushRef.current(), 700);
  }, []);

  const commit = useCallback((result: Mutation) => {
    const owner = modeRef.current === "fixture" ? "fixture" : emailRef.current;
    docsRef.current = result.docs;
    const queue = queueRef.current;
    queue.email = owner || "fixture";
    queue.events.push(result.event);
    const keys = result.keys?.length ? result.keys : ["collections"];
    const patch: DocMap = {};
    for (const key of keys) patch[key] = result.docs[key];
    queue.docs = { ...queue.docs, ...patch };
    saveQueue(queue);
    if (owner) saveCache(owner, result.docs);
    setDocs(result.docs);
    setPhase("saving");
    schedule();
  }, [schedule]);

  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("fixture")) return;
    if (!email) return;
    modeRef.current = "remote";
    setMode("remote");
    let cancel = false;
    const owner = email;
    (async () => {
      const cached = loadCache(owner);
      queueRef.current = loadQueue(owner);
      if (cached && !cancel) {
        const merged = overlay(cached, queueRef.current);
        docsRef.current = merged;
        setDocs(merged);
      }
      try {
        const { data, error } = await supabase.from("qj_docs").select("id,key,data");
        if (error) throw error;
        if (cancel) return;
        const map: DocMap = {};
        const ids: Record<string, string> = {};
        for (const row of data || []) {
          const rec = row as { id: string; key: string; data: unknown };
          map[rec.key] = rec.data;
          ids[rec.key] = rec.id;
        }
        idsRef.current = ids;
        const merged = overlay(map, queueRef.current);
        docsRef.current = merged;
        setDocs(merged);
        saveCache(owner, merged);
        setLoadError("");
        if (queueRef.current.events.length || Object.keys(queueRef.current.docs).length > 0) void flushRef.current();
      } catch (error) {
        if (cancel) return;
        if (!cached) setLoadError(messageOf(error));
        else if (typeof navigator !== "undefined" && navigator.onLine === false) {
          setPhase("queued");
          setDetail("Showing the last copy saved on this device");
        }
      }
    })();
    return () => { cancel = true; };
  }, [email]);

  useEffect(() => {
    const onOnline = () => void flushRef.current();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  const enterFixture = useCallback(async () => {
    if (!import.meta.env.DEV) return;
    const mod = await import("../dev/fixture");
    const loaded = await mod.loadFixtureDocs();
    modeRef.current = "fixture";
    queueRef.current = emptyQueue("fixture");
    docsRef.current = loaded;
    saveCache("fixture", loaded);
    setMode("fixture");
    setDocs(loaded);
    setLoadError("");
    setPhase("idle");
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (!new URLSearchParams(window.location.search).has("fixture")) return;
    void enterFixture().catch((error) => setLoadError(messageOf(error)));
  }, [enterFixture]);

  const sendLink = useCallback(async (address: string) => {
    setAuthError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: address.trim(),
      options: { emailRedirectTo: appUrl(), shouldCreateUser: true },
    });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setLinkSent(true);
  }, []);

  const signOut = useCallback(async () => {
    if (modeRef.current === "fixture") {
      modeRef.current = null;
      docsRef.current = {};
      setMode(null);
      setDocs(null);
      if (import.meta.env.DEV && new URLSearchParams(window.location.search).has("fixture")) {
        const url = new URL(window.location.href);
        url.searchParams.delete("fixture");
        window.history.replaceState({}, "", url);
      }
      return;
    }
    await supabase.auth.signOut();
    docsRef.current = {};
    setDocs(null);
    setMode(null);
  }, []);

  const view: JournalView | null = useMemo(() => (docs ? buildView(docs) : null), [docs]);

  const actions: JournalActions = useMemo(() => ({
    phase,
    detail,
    email: mode === "fixture" ? "" : email,
    mode: mode === "fixture" ? "fixture" : "remote",
    logChronicle: (sessionName, text) => commit(addChronicle(docsRef.current, sessionName, text)),
    toggleHabitToday: (questId) => commit(toggleHabitToday(docsRef.current, questId)),
    setQuestStatus: (questId, status) => commit(setQuestStatus(docsRef.current, questId, status)),
    toggleQuestStep: (questId, index) => commit(toggleQuestStep(docsRef.current, questId, index)),
    adjustItem: (id, qty, flag) => commit(adjustItem(docsRef.current, id, qty, flag)),
    gradeRune: (id, grade: Grade) => commit(gradeRune(docsRef.current, id, grade)),
    addRune: (input) => commit(addRune(docsRef.current, input)),
    addReading: (input) => commit(addReading(docsRef.current, input)),
    requestEpisode: () => commit(requestEpisode(docsRef.current)),
    requestSeries: (input) => commit(requestSeries(docsRef.current, input)),
    saveSettings: (settings) => commit(saveSettings(docsRef.current, settings)),
    signOut: () => void signOut(),
  }), [phase, detail, email, mode, commit, signOut]);

  return { booting, session, mode, view, actions, loadError, linkSent, authError, sendLink, enterFixture, reload: () => void flush() };
}
