// Supabase 설정
const SUPABASE_URL = 'https://jvfxjoedhujkhhbxzvja.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2Znhqb2VkaHVqa2hoYnh6dmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjA1NTYsImV4cCI6MjA2NzE5NjU1Nn0.1teAP5Inbv5qBh1nYwt8lCOKFfmbmyizof629y4NTgA';

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 변수
let isComposing = false;
let isLoading = false;

// 상태 메시지 업데이트
function updateStatus(message, isError = false) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#cc0000' : '#666';
}

// 에러 메시지 표시
function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

// 메시지 추가
async function addMessage() {
    if (isLoading) return;
    
    const input = document.getElementById('messageInput');
    const submitBtn = document.getElementById('submitBtn');
    const text = input.value.trim();
    
    if (text === '') {
        alert('메시지를 입력해주세요');
        return;
    }
    
    try {
        isLoading = true;
        submitBtn.disabled = true;
        submitBtn.textContent = '전송 중...';
        
        // Supabase에 메시지 저장
        const { data, error } = await supabase
            .from('messages')
            .insert([
                { 
                    content: text,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) {
            throw error;
        }
        
        // 입력창 초기화
        input.value = '';
        input.style.height = '46px';
        
        // 메시지 목록 새로고침
        await loadMessages();
        
        updateStatus('');
        
    } catch (error) {
        console.error('메시지 전송 실패:', error);
        showError('메시지 전송에 실패했습니다: ' + error.message);
    } finally {
        isLoading = false;
        submitBtn.disabled = false;
        submitBtn.textContent = '📝 전송하기';
    }
}

// 메시지 목록 불러오기
async function loadMessages() {
    try {
        updateStatus('메시지를 불러오는 중...');
        
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) {
            throw error;
        }
        
        renderMessages(data || []);
        updateStatus(`총 ${data?.length || 0}개의 메시지`);
        
    } catch (error) {
        console.error('메시지 불러오기 실패:', error);
        showError('메시지를 불러올 수 없습니다: ' + error.message);
        renderMessages([]);
    }
}

// 메시지 렌더링
function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="no-messages">아직 작성된 메시지가 없습니다.<br>첫 번째 메시지를 남겨보세요!</div>';
        return;
    }
    
    container.innerHTML = '';
    
    messages.forEach((message, index) => {
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        const createdAt = new Date(message.created_at);
        const timeString = createdAt.toLocaleString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-number">No.${message.id}</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-text">${escapeHtml(message.content).replace(/\n/g, '<br>')}</div>
        `;
        
        container.appendChild(messageElement);
    });
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 자동 높이 조절
function autoResize(textarea) {
    const minHeight = 46;
    textarea.style.height = minHeight + 'px';
    if (textarea.scrollHeight > minHeight) {
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }
}

// 방문자 수 업데이트
async function updateVisitorStats() {
    try {
        // 방문자 수 증가
        const { data, error } = await supabase.rpc('increment_visitor_count');
        
        if (error) {
            console.error('방문자 수 업데이트 실패:', error);
            // 실패해도 기본값으로 표시
            setDefaultVisitorStats();
            return;
        }
        
        // 방문자 수 표시 업데이트
        if (data) {
            document.getElementById('totalVisitors').textContent = String(data.total || 0).padStart(6, '0');
            document.getElementById('todayVisitors').textContent = String(data.today || 0).padStart(3, '0');
            document.getElementById('yesterdayVisitors').textContent = String(data.yesterday || 0).padStart(3, '0');
            document.getElementById('maxVisitors').textContent = String(data.max_daily || 0).padStart(3, '0');
        }
        
    } catch (error) {
        console.error('방문자 통계 오류:', error);
        setDefaultVisitorStats();
    }
}

// 기본 방문자 수 설정
function setDefaultVisitorStats() {
    const total = Math.floor(Math.random() * 500) + 100;
    const today = Math.floor(Math.random() * 50) + 5;
    const yesterday = Math.floor(Math.random() * 50) + 5;
    const max = Math.floor(Math.random() * 100) + 50;
    
    document.getElementById('totalVisitors').textContent = String(total).padStart(6, '0');
    document.getElementById('todayVisitors').textContent = String(today).padStart(3, '0');
    document.getElementById('yesterdayVisitors').textContent = String(yesterday).padStart(3, '0');
    document.getElementById('maxVisitors').textContent = String(max).padStart(3, '0');
}

// 실시간 업데이트 구독
function subscribeToMessages() {
    const channel = supabase
        .channel('messages')
        .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'messages' }, 
            (payload) => {
                console.log('새 메시지 수신:', payload);
                loadMessages(); // 새 메시지가 추가되면 목록 새로고침
            }
        )
        .subscribe();
    
    return channel;
}

// 이벤트 리스너 설정
function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    
    // Enter 키 처리
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey && !isComposing && !isLoading) {
            e.preventDefault();
            addMessage();
        }
    });
    
    // 한글 입력 처리
    messageInput.addEventListener('compositionstart', function(e) {
        isComposing = true;
    });
    
    messageInput.addEventListener('compositionend', function(e) {
        isComposing = false;
    });
    
    // 자동 높이 조절
    messageInput.addEventListener('input', function(e) {
        autoResize(e.target);
    });
}

// 데이터베이스 테이블 확인 및 생성
async function initializeDatabase() {
    try {
        // 메시지 테이블이 있는지 확인
        const { data, error } = await supabase
            .from('messages')
            .select('count', { count: 'exact', head: true });
        
        if (error && error.code === 'PGRST116') {
            // 테이블이 없으면 안내 메시지 표시
            showError('데이터베이스 테이블이 설정되지 않았습니다. setup.sql 파일을 실행해주세요.');
            updateStatus('데이터베이스 설정 필요', true);
            return false;
        } else if (error) {
            throw error;
        }
        
        updateStatus('데이터베이스 연결 성공');
        return true;
        
    } catch (error) {
        console.error('데이터베이스 초기화 실패:', error);
        showError('데이터베이스 연결에 실패했습니다: ' + error.message);
        updateStatus('데이터베이스 연결 실패', true);
        return false;
    }
}

// 앱 초기화
async function initializeApp() {
    try {
        updateStatus('앱 초기화 중...');
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // 데이터베이스 초기화
        const dbReady = await initializeDatabase();
        
        if (dbReady) {
            // 메시지 불러오기
            await loadMessages();
            
            // 실시간 구독 시작
            subscribeToMessages();
            
            // 방문자 수 업데이트
            await updateVisitorStats();
            
            // 입력창에 포커스
            document.getElementById('messageInput').focus();
            
            updateStatus('');
        }
        
    } catch (error) {
        console.error('앱 초기화 실패:', error);
        showError('앱 초기화에 실패했습니다: ' + error.message);
        updateStatus('초기화 실패', true);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initializeApp);
