"""Async pipeline queue for audio -> transcript -> report jobs.

The upload endpoint returns immediately and only *enqueues* a job; a small pool
of asyncio worker tasks drains the queue in FIFO order. Because Whisper
transcription is CPU-bound and the LLM/DB calls are blocking, each job body is
offloaded to a thread with ``asyncio.to_thread`` so the event loop (and thus
every API request) is never blocked. Bounded workers also cap how many heavy
jobs run at once instead of spawning an unbounded thread per upload.
"""
import asyncio
import logging
from typing import List, Tuple

from ..config import settings
from . import report_service

logger = logging.getLogger(__name__)


class PipelineQueue:
    """A FIFO job queue drained by a fixed number of async workers."""

    def __init__(self, workers: int) -> None:
        self._queue: "asyncio.Queue[Tuple[int, str]]" = asyncio.Queue()
        self._workers = max(1, workers)
        self._tasks: List[asyncio.Task] = []
        self._running = False

    async def start(self) -> None:
        if self._running:
            return
        self._running = True
        for i in range(self._workers):
            self._tasks.append(
                asyncio.create_task(self._worker(i), name=f"pipeline-worker-{i}")
            )
        logger.info("pipeline queue started with %d worker(s)", self._workers)

    async def stop(self) -> None:
        self._running = False
        for task in self._tasks:
            task.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()

    def enqueue(self, session_id: int, audio_path: str) -> None:
        """Add a job without waiting; safe to call from sync or async code."""
        self._queue.put_nowait((session_id, audio_path))

    def pending(self) -> int:
        return self._queue.qsize()

    async def _worker(self, index: int) -> None:
        while True:
            session_id, audio_path = await self._queue.get()
            try:
                # Offload the blocking/CPU-bound pipeline to a thread so the
                # event loop stays free to serve API requests.
                await asyncio.to_thread(
                    report_service.process_audio_session, session_id, audio_path
                )
            except asyncio.CancelledError:
                self._queue.task_done()
                raise
            except Exception:  # noqa: BLE001 - never let one job kill the worker
                logger.exception("pipeline job failed for session %s", session_id)
            finally:
                self._queue.task_done()

    def requeue_stuck(self) -> int:
        """Re-enqueue sessions left in 'processing' by a previous crash/restart.

        Returns the number of jobs re-queued. Called once at startup.
        """
        stuck = report_service.list_stuck_sessions()
        for session_id, audio_path in stuck:
            self.enqueue(session_id, audio_path)
        if stuck:
            logger.info("re-queued %d stuck session(s) at startup", len(stuck))
        return len(stuck)


# Module-level singleton wired into the app lifespan.
pipeline = PipelineQueue(settings.pipeline_workers)
