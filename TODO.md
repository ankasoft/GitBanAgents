# GitBan Agent - Proje Todo Listesi

## 1. Proje Tanımı & Kapsam

### 1.1 Genel Bakış
- **Proje Adı**: gitban_agent
- **Tip**: npm paketi (npx ile çalışan CLI + Web Arayüzü)
- **Amaç**: Kodlama agent'larını (Claude Code, Opencode, Codex) eşzamanlı yönetmek için Kanban arayüzü
- **Hedef Kullanıcı**: Solo geliştiriciler
- **Platform**: macOS, Linux, Windows (cross-platform)

### 1.2 Temel Özellikler
- GitHub Issues üzerinden iş takibi (5 kolonlu Kanban: Projects, Backlog, Doing, Review, Done)
- Çoklu agent desteği (Claude Code, Opencode, Codex)
- Agent'ları aynı anda farklı issue'larda çalıştırabilme
- Türkçe/İngilizce dil desteği
- Açık/Koyu tema desteği

---

## 2. Kurulum & Dağıtım

### 2.1 npm Paketi Hazırlığı
- [ ] `package.json` oluştur (name: gitban_agent, bin: gitban_agent.js)
- [ ] Dependencies: svelte, octokit
- [ ] DevDependencies: @sveltejs/vite-plugin-svelte, vite, svelte-check, typescript

### 2.2 CLI Entegrasyonu
- [ ] `bin/gitban_agent.js` - Ana giriş noktası (shebang: #!/usr/bin/env node)
- [ ] `npx gitban_agent` komutu ile browser'da arayüz açılacak
- [ ] Platform bazlı browser açma (open, xdg-open, start)

---

## 3. GitHub Entegrasyonu

### 3.1 Authentication
- [ ] GitHub Personal Access Token (PAT) ile kimlik doğrulama
- [ ] Token güvenli saklama (platform: keytar/credential-store veya .env)
- [ ] İlk kullanımda token girişi için setup akışı

### 3.2 Repository Bağlantısı
- [ ] Kullanıcı repository'sini seçme (GET /user/repos)
- [ ] Repository URL'den otomatik çıkarım (git remote -v parse)
- [ ] Bağlı repo bilgisini lokal dosyada saklama (~/.gitban_agent/config.json)

### 3.3 Issue Yönetimi (via GitHub REST API)
- [ ] Issues listeleme (GET /repos/{owner}/{repo}/issues)
- [ ] Issue oluşturma (POST /repos/{owner}/{repo}/issues)
- [ ] Issue güncelleme (PATCH /repos/{owner}/{repo}/issues/{issue_number})
- [ ] Issue'a yorum ekleme (POST /repos/{owner}/{repo}/issues/{issue_number}/comments)
- [ ] Issue label yönetimi (Kolon bazlı label: project, backlog, doing, review, done)
- [ ] Milestone kullanımı (opsiyonel - projeler için)

---

## 4. Kanban Arayüzü

### 4.1 Kolon Yapısı
- [ ] **Projects**: Eklenen projeler (sola dar kolon)
  - [ ] Her proje için: repo adı, issue metrikleri (toplam/backlog/doing/review/done sayıları)
  - [ ] Aktif proje vurgulu (seçili)
  - [ ] Proje ekleme butonu (+)
- [ ] **Backlog**: Yapılacak işler
- [ ] **Doing**: Aktif çalışılanlar
- [ ] **Review**: Agent çalışması tamamlandı, kontrol bekliyor
- [ ] **Done**: Tamamlananlar

### 4.2 Proje Yönetimi
- [ ] Proje ekleme: Klasör seçici dialog (directory picker)
- [ ] Seçilen klasörde `git remote -v` parse edilerek repo tespiti
- [ ] Her proje için ayrı agent seçimi (Claude Code / Opencode / Codex)
- [ ] Proje başına ayarlar (agent, autoPR, baseBranch, customAgentArgs) store'da sakla
- [ ] Proje silme (sadece listeden çıkarır, GitHub'dan silmez)

### 4.3 Proje Bazlı Özel Agent Komutları
- [ ] Her proje için ek agent flag'leri/argümanları tanımlanabilir
- [ ] Özel komutlar: `claude --print --no-input {customArgs}` şeklinde eklenir
- [ ] Environment variables desteği (API key'ler vs.)
- [ ] CLI komut template'i: `{agent} {baseFlags} {customArgs} -- {issue instruction}`
- [ ] Settings arayüzünden düzenlenebilir (kullanıcı dostu input)

### 4.2 Kolon Stilleri
- [ ] Sürükle-bırak (drag-and-drop) ile issue taşıma
- [ ] Kolonlar arası sürükleyerek status değişikliği (label güncelleme)
- [ ] Her kolonun kendine özgü renk kodu

### 4.3 Issue Kartları
- [ ] Issue numarası, başlık, label'lar
- [ ] Atanan agent (eğer çalışıyorsa) gösterimi
- [ ] Son güncelleme zamanı
- [ ] Yorum sayısı
- [ ] **Backlog kartlarında**: Play (▶) butonu - agent başlatmak için
- [ ] **Doing kartlarında**: Durum göstergesi (agent çalışıyor/idle)
- [ ] **Review kartlarında**: Gözden geçir butonu

### 4.4 Issue Detay Ekranı (Split View - 1/4 + 3/5)
- [ ] Ekran 1/4 (sol): Issue içeriği
  - [ ] Issue başlık ve body (markdown render)
  - [ ] Label'lar
  - [ ] Yorumlar listesi
  - [ ] Geri (←) butonu ile listeye dön
- [ ] Ekran 3/5 (sağ): Agent Terminal Paneli
  - [ ] Real-time stdout/stderr akışı
  - [ ] Agent durumu (idle, running, completed, failed)
  - [ ] Durdur butonu
  - [ ] Review'a taşı butonu (işlem bitince)
- [ ] Split view oranları: responsive (mobilde stacked)

### 4.5 Play - Agent Başlatma Akışı (Backlog → Doing)
1. Backlog kartında play'e basılır
2. Issue'ya yorum ekle: "🤖 Agent started: {agent_name}"
3. Yeni branch oluştur (`git checkout -b feature/issue-{number}-{slug}`)
4. Issue label'ı "doing" olarak güncelle
5. Agent subprocess başlat (issue body + instruction ile)
6. Agent stdout/stderr → terminal paneli + issue yorumuna stream
7. Agent bitince:
   - Issue'ya yorum ekle: "✅ Agent completed" veya "❌ Error: {message}"
   - Otomatik commit (`git add -A && git commit -m "feat: {issue title} (#{number})"`)
   - Issue label'ı "review" olarak güncelle
   - Yorum olarak commit linki ekle

---

## 5. Agent Yönetimi

### 5.1 Agent Tanımları
- [ ] Claude Code: `claude` CLI kontrol (--print, --agent)
- [ ] Opencode: `opencode` CLI kontrol
- [ ] Codex: `openai` veya `codex` CLI kontrol
- [ ] Non-interactive mode: Tüm agent'lar için soru sormayı disable eden flag kullan
  - [ ] Claude Code: `--no-input` veya `ANTHROPIC_API_FLAGS: --no-stream-input`
  - [ ] Opencode: `--no-confirm` veya benzeri flag
  - [ ] Codex: `NONINTERACTIVE=1`

### 5.2 Agent Çalıştırma
- [ ] Seçilen issue'yu agent'a atama
- [ ] Subprocess spawn ile agent'ı non-interactive mode'da çalıştırma
- [ ] Proje bazlı özel komutlar (customAgentArgs) agent CLI'sına eklenir
- [ ] stdout/stderr real-time stream (terminal output)
- [ ] Agent durumu: idle, running, completed, failed

### 5.3 Issue'a Otomatik Loglama
- [ ] Agent başladığında issue'ya yorum ekle: "🤖 Agent started: {agent_name}"
- [ ] Agent stdout/stderr'u real-time issue yorumuna stream et (ör: her 5 saniyede bir update veya önemli çıktılar)
- [ ] Hata oluştuğunda issue'ya yorum ekle: "❌ Error: {error_message}"
- [ ] Agent tamamlandığında issue'ya yorum ekle:
  - "✅ Agent completed successfully"
  - Commit linki (varsa)
  - Özet veya agent'ın yaptığı işlerin listesi
- [ ] Log formatı: timestamp + agent name + message

### 5.4 Git Worktree & Branch Yönetimi
- [ ] Her agent için AYRI worktree oluştur
  - [ ] Worktree yolu: `.gitban_agent/worktrees/issue-{number}/`
  - [ ] Branch adı formatı: `feature/issue-{number}-{slug}`
  - [ ] `git worktree add {path} -b {branch}` komutu
- [ ] Agent o worktree içinde çalışır (ana repo temiz kalır)
- [ ] Agent bitince:
  - [ ] Otomatik commit
  - [ ] Commit mesajı: `feat(#issue-{number}): {issue title}`
  - [ ] Issue linki: `Closes #{number}` veya `Fixes #{number}`
  - [ ] Push opsiyonel (settings'de)
- [ ] Worktree temizliği:
  - [ ] Başarılı agent: worktree kaldırılır, branch kalır
  - [ ] Başarısız agent: worktree + branch birlikte silinir (opsiyonel)
- [ ] Ana repo'da `main` veya `master` branch'i hep temiz kalır

### 5.5 Otomatik PR Oluşturma (Proje Bazlı)
- [ ] Proje başına "Otomatik PR" toggle ayarı
- [ ] Agent bitince otomatik PR oluşturma
  - [ ] PR başlığı: `{issue title} (#{number})`
  - [ ] PR body: Issue linki + agent özeti
  - [ ] Head branch: `feature/issue-{number}-{slug}`
  - [ ] Base branch: `main` veya `master` (ayarlanabilir)
- [ ] PR başarılı oluşturulursa issue'ya yorum olarak PR linki ekle

### 5.6 Multi-Agent Desteği
- [ ] Aynı anda birden fazla agent çalıştırabilme (her biri ayrı worktree)
- [ ] Her agent'ın hangi issue'da çalıştığını gösterme
- [ ] Agent output'unu ayrı terminal penceresi veya panelde gösterme
- [ ] Agent'ı durdurma (kill signal) desteği (worktree + branch temizliği ile)

### 5.7 Agent Timeout
- [ ] Her agent için max çalışma süresi (varsayılan: 30 dakika)
- [ ] Timeout sonunda otomatik durdurma (SIGTERM, gerekirse SIGKILL)
- [ ] Timeout sonrası: worktree temizliği + issue'ya yorum + "⏰ Timeout" logu
- [ ] Proje başına timeout süresi ayarlanabilir

### 5.8 Agent Retry
- [ ] Agent hata sonucu biterse otomatik retry (varsayılan: 2 kez)
- [ ] Retry sayısı proje ayarlarında 0-3 arası ayarlanabilir
- [ ] Her retry öncesi issue'ya yorum: "🔄 Retry {n}/{max}"
- [ ] Max retry aşılınca işlem bırakılır, kullanıcıya bildirim

### 5.9 Agent Konfigürasyonu
- [ ] Her agent için çalışma dizini (working directory) seçimi
- [ ] Agent'a özel argümanlar/flag'ler

---

## 6. Ayarlar (Settings)

### 6.1 Dil Seçimi
- [ ] Türkçe / İngilizce toggle
- [ ] Locale dosyaları (tr.json, en.json)
- [ ] Seçimin localStorage'da saklanması

### 6.2 Tema
- [ ] Açık / Koyu tema toggle
- [ ] CSS variables ile tema yönetimi
- [ ] Sistem tercihini algılama (prefers-color-scheme)
- [ ] Seçimin localStorage'da saklanması

### 6.3 GitHub Ayarları
- [ ] PAT token güncelleme
- [ ] Bağlı repository değiştirme
- [ ] Çıkış yapma (logout)

### 6.4 Agent Ayarları
- [ ] Agent path'leri (sistem PATH'inde değilse)
- [ ] Default agent seçimi (yeni projeler için)
- [ ] Proje başına agent seçimi (her proje farklı agent kullanabilir)
- [ ] Proje başına timeout süresi
- [ ] Proje başına retry sayısı
- [ ] Non-interactive mode varsayılanı açık olsun

### 6.5 Bildirim Ayarları
- [ ] Sistem bildirimleri açık/kapalı
- [ ] Agent bitince bildirim
- [ ] Hata oluşunca bildirim
- [ ] Timeout sonrası bildirim

---

## 7. UI/UX Detayları

### 7.1 Sistem Bildirimleri
- [ ] Agent bitince/kaza sonucu sistem notification
- [ ] Notification içeriği: Agent adı, issue numarası, durum (success/error/timeout)
- [ ] Notification tıklanınca ilgili issue'ya odaklan
- [ ] Bildirimler ayarlardan kapatılabilir

### 7.2 Klavye Kısayolları
- [ ] `P` - Seçili issue'yu Play (backlog'ta)
- [ ] `R` - Review'e taşı
- [ ] `D` - Done'a taşı
- [ ] `Esc` - Detay ekranından listeye geri dön
- [ ] `Ctrl+/` - Kısayol listesini göster (help modal)
- [ ] `Ctrl+F` - Issue arama/filteleme modalı aç
- [ ] Aktif input'ta çalışmaz (text field'ta yazarken tetiklenmez)

### 7.3 Issue Arama ve Filtreleme
- [ ] Arama kutusu: issue başlığında ve body'de arama
- [ ] Label filtreleme (çoklu seçim)
- [ ] Durum filtresi (hangi kolonlarda görüneceği)
- [ ] Assignee filtresi (agent çalışıyorsa)
- [ ] Sonuçlar anlık filtrele (debounce 300ms)

### 7.4 Ana Branch Koruma
- [ ] Ana branch'e (main/master) yanlışlıkla commit önleme
- [ ] Kontrol: Agent worktree dışında commit yapılmaya çalışılırsa uyarı
- [ ] `.gitban_agent/` klasörü otomatik `.gitignore`'a ekle
- [ ] Ana branch koruma ayarı açık/kapalı edilebilir (settings)

### 7.5 Top Bar (Üst)
- [ ] Logo/Proje adı
- [ ] Repository adı gösterimi
- [ ] Arama kutusu (Ctrl+F kısayolu)
- [ ] Ayarlar butonu (sağ üst)
- [ ] Minimal, dar tasarım

### 7.6 Responsive Tasarım
- [ ] Mobil görünümde yatay scroll veya stacked kolonlar
- [ ] Tablet uyumu

---

## 8. Teknik Mimari

### 8.1 State Management
- [ ] Svelte stores (built-in reactive) - global state
  - [ ] projects[]: Her proje için (path, repo, agent, autoPR, baseBranch, customAgentArgs, timeout, retryCount, issueCounts)
  - [ ] currentProject: Aktif proje
  - [ ] issues[]: GitHub'dan çekilen issue'lar
  - [ ] agents[]: Çalışan agent'lar (issue, status, output, worktreePath)
  - [ ] settings: theme, language, defaultAgent, pushOnComplete, notifications, branchProtection

### 8.2 Data Fetching
- [ ] Octokit REST API calls with Svelte stores
- [ ] Polling interval: 30 saniye (opsiyonel, manual refresh de olabilir)

### 8.3 Dosya Yapısı
```
gitban_agent/
├── bin/
│   └── gitban_agent.js       # CLI entry point
├── src/
│   ├── main.ts               # Svelte entry
│   ├── App.svelte
│   ├── lib/
│   │   ├── components/
│   │   │   ├── Kanban/
│   │   │   ├── ProjectColumn.svelte     # Sol dardaki proje kolonu
│   │   │   ├── Board.svelte
│   │   │   ├── Column.svelte
│   │   │   └── IssueCard.svelte
│   │   │   ├── IssueDetail/
│   │   │   │   ├── SplitView.svelte      # 1/4 + 3/5 layout
│   │   │   │   ├── IssuePanel.svelte     # Sol panel (1/4)
│   │   │   │   └── AgentTerminal.svelte  # Sağ panel (3/5)
│   │   │   ├── Settings.svelte
│   │   │   └── common/
│   │   ├── stores/
│   │   │   ├── github.ts     # GitHub state
│   │   │   ├── agent.ts      # Agent state
│   │   │   └── settings.ts   # Theme, language
│   │   ├── services/
│   │   │   ├── github.ts     # Octokit wrapper (issues + PRs)
│   │   │   ├── agent.ts      # Subprocess manager
│   │   │   ├── git.ts        # Git worktree/branch manager
│   │   │   └── notification.ts  # Sistem bildirimleri
│   │   └── i18n/
│   │       ├── tr.json
│   │       └── en.json
│   └── styles/
│       └── global.css        # CSS variables, theme
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 9. Güvenlik

### 9.1 Token Yönetimi
- [ ] PAT token'ı plaintext'te saklama, platform güvenli store kullan
- [ ] .gitignore'a config dosyasını ekle
- [ ] Token scopes: repo (full control)

---

## 10. Test & Deployment

### 10.1 Test
- [ ] Unit test: GitHub API wrapper
- [ ] Unit test: Svelte stores
- [ ] E2E test: Manuel test senaryoları

### 10.2 npm Publish
- [ ] README.md hazırla (kurulum, kullanım, screenshot)
- [ ] package.json: keywords, description, repository, author, license (MIT)
- [ ] GitHub repo oluştur (public)
- [ ] npm login & npm publish (public)
- [ ] CI/CD: GitHub Actions ile otomatik npm publish (opsiyonel)

---

## 11. İleride Eklenebilir (Future)

- [ ] Webhook ile real-time update (GitHub App değil, basit webhook)
- [ ] Agent history/log kaydı
- [ ] Issue template yönetimi
- [ ] Analytics/dashboard
- [ ] VS Code extension

---

## Öncelik Sırası (P0 = Önce)

### P0 - MVP İçin Gerekli
1. npm paketi yapısı + CLI giriş noktası
2. GitHub PAT auth + repo seçimi
3. Issue listesi (5 kolon) - okuma
4. Issue oluşturma/güncelleme (label ile kolon değişimi)
5. Sürükle-bırak ile kolonlar arası taşıma
6. Backlog'da play ile agent başlatma (branch açma, doing'e taşıma)
7. Agent çalışırken split view (1/4 + 3/5) ile takip
8. Agent bitince auto-commit + review'e taşıma
9. Dil & tema ayarı

### P1 - İyi Bir Deneyim İçin
1. Multi-agent aynı anda çalıştırma
2. Agent durdurma (kill signal)
3. Agent çıktısını issue yorumuna otomatik ekleme
4. Review'dan geri alma (review → doing)

### P2 - Güzellik
1. Responsive tasarım (mobilde stacked split view)
2. Loading states
3. Error handling
4. Branch push opsiyonu

### P2 - Güzellik
1. Responsive tasarım
2. Loading states
3. Error handling
4. Optimistic UI updates
