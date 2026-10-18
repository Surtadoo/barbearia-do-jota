package com.barbeariadojota.app;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Baixa o APK novo direto no celular e abre a tela de instalacao do Android.
 *
 * Usado pelo botao "Atualizar agora" do popup de atualizacao.
 */
@CapacitorPlugin(name = "ApkUpdate")
public class ApkUpdatePlugin extends Plugin {

    private long downloadId = -1;
    private String pendingUrl = "";

    @PluginMethod
    public void instalar(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("endereco do apk nao informado");
            return;
        }
        pendingUrl = url.trim();

        try {
            DownloadManager dm = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) {
                call.reject("gerenciador de downloads indisponivel");
                return;
            }

            // remove baixa anterior do mesmo arquivo, se houver
            dm.remove(downloadId);
            downloadId = -1;

            String nomeArquivo = arquivoNome(pendingUrl);
            Uri destino = Uri.parse("content://downloads/public_downloads");
            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(pendingUrl))
                    .setTitle("Barbearia do Jota")
                    .setDescription("Baizando atualizacao...")
                    .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                    .setMimeType("application/vnd.android.package-archive")
                    .setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, nomeArquivo)
                    .setAllowedOverMetered(true)
                    .setAllowedOverRoaming(true);
            downloadId = dm.enqueue(req);

            // avisa o usuario
            android.widget.Toast.makeText(getContext(),
                    "Baizando a atualizacao...", android.widget.Toast.LENGTH_LONG).show();

            call.resolve();
        } catch (Exception e) {
            call.reject("nao consegui iniciar o download: " + e.getMessage());
        }
    }

    @PluginMethod
    public void abrirDownloads(PluginCall call) {
        try {
            Intent i = new Intent(DownloadManager.ACTION_VIEW_DOWNLOADS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }

    private String arquivoNome(String url) {
        try {
            String arquivo = url.substring(url.lastIndexOf('/') + 1);
            if (arquivo.contains("?")) arquivo = arquivo.split("\\?")[0];
            if (arquivo.isEmpty() || !arquivo.toLowerCase().endsWith(".apk")) {
                arquivo = "Barbearia-do-Jota-atualizacao.apk";
            }
            return arquivo;
        } catch (Exception e) {
            return "Barbearia-do-Jota-atualizacao.apk";
        }
    }

    // quando o download termina, abre a instalacao automaticamente
    @Override
    public void load() {
        super.load();
        getContext().registerReceiver(new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id == -1 || id != downloadId) return;
                try {
                    instalarAgora();
                } catch (Exception e) {
                    // se nao conseguir abrir sozinho, o arquivo fica nos Downloads
                    notificar("\u00c9 hora de abrir a pasta Downloads para instalar.");
                }
            }
        }, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
    }

    private void instalarAgora() {
        String arquivo = new java.io.File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                arquivoNome(pendingUrl)).getAbsolutePath();

        java.io.File f = new java.io.File(arquivo);
        if (!f.exists()) {
            notificar("Arquivo do APK nao encontrado nos Downloads.");
            return;
        }

        Uri uri;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            uri = FileProvider.getUriForFile(
                    getContext(), getContext().getPackageName() + ".fileprovider", f);
        } else {
            uri = Uri.fromFile(f);
        }

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(uri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
    }

    private void notificar(final String texto) {
        getActivity().runOnUiThread(new Runnable() {
            public void run() {
                android.widget.Toast.makeText(getContext(), texto,
                        android.widget.Toast.LENGTH_LONG).show();
            }
        });
    }
}
