# 149 — Fix: mensajes del agente desbordaban el panel de chat

**Fecha:** 2026-07-12
**Rama:** `feat/visual-email-editor`

## Bug

Texto del agente y tool cards se salían del panel de chat por la derecha
(quedaban cortados bajo el divisor del preview). El truncado del tool call
no alcanzaba porque el contenedor entero estaba inflado.

## Causa

Raíz de `AiMessage`: `mr-auto` dentro de un padre `flex flex-col`.
El margen auto en el eje transversal impide el stretch del flex item, así
que el mensaje se dimensionaba por contenido (~692px) en vez del ancho del
contenedor (~481px). Todo lo interno (párrafos, tool cards, max-w-[45%])
resolvía contra ese ancho inflado.

## Fix

`mr-auto` → `w-full max-w-full` en la raíz de AiMessage. Verificado en
vivo con Chrome (0 elementos desbordando tras reload; texto envuelve, URL
trunca, summary envuelve).
