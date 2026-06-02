use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Manager, Runtime, WindowEvent,
};

mod migrations;

const MAIN_WINDOW_LABEL: &str = "main";
const TRAY_ID: &str = "c3bot-main-tray";
const TRAY_OPEN_ID: &str = "open-main-window";
const TRAY_QUIT_ID: &str = "quit-application";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            setup_tray(app)?;

            // Apply schema migrations through the unified, idempotent runner that shares
            // the `__c3bot_migrations` tracking table with the Node dev API. We resolve
            // the SAME path the SQL plugin uses (`app_config_dir()/c3bot.db`) so both the
            // runner and `Database.load("sqlite:c3bot.db")` operate on one file.
            // See docs/adr/ADR-001-idempotent-migrations.md.
            let config_dir = app.path().app_config_dir()?;
            std::fs::create_dir_all(&config_dir)?;
            let db_path = config_dir.join("c3bot.db");
            migrations::run_migrations(&db_path, "tauri").map_err(|error| {
                std::io::Error::new(std::io::ErrorKind::Other, error.to_string())
            })?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .plugin(tauri_plugin_opener::init())
        // The SQL plugin is used only for runtime queries from the frontend; migrations
        // are owned by the unified runner above (not the plugin's `add_migrations`).
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray<R: Runtime>(app: &mut App<R>) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, TRAY_OPEN_ID, "Abrir C3Bot", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, TRAY_QUIT_ID, "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_item, &separator, &quit_item])?;

    let mut tray = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("C3Bot")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            if event.id() == TRAY_OPEN_ID {
                show_main_window(app);
            }

            if event.id() == TRAY_QUIT_ID {
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| match event {
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            }
            | TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } => show_main_window(tray.app_handle()),
            _ => {}
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        tray = tray.icon(icon);
    }

    tray.build(app)?;
    Ok(())
}

fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW_LABEL) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}
