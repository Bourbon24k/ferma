# Telegram Pixel Farm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Controls

- Choose **Вскопать**, then select an empty starter-bed tile to prepare it.
- Choose **Посадить**, then select a prepared tile to plant the selected seeds.
- Choose **Полить** to water a seeded or dry crop; choose **Собрать** when it is ready.
- Choose **Строительство** to buy a bed for 6 wood, then select a valid grass cell to place it.
- While building, each bed offers **Переместить** and **Убрать**. Beds can only be moved or stored when their tiles are empty or prepared.

Progress is stored in the browser's local storage and is restored on reload.
