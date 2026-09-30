// 포켓몬 배틀 — 기능을 하나씩 추가하는 JavaScript 프로젝트
// 각 STEP을 끝낼 때마다 브라우저에서 새로운 기능을 직접 확인합니다.

const API_URL = "https://pokeapi.co/api/v2/pokemon/";
const $ = (id) => document.getElementById(id);

const TYPE_NAMES = {
  normal:"노말", fire:"불꽃", water:"물", electric:"전기", grass:"풀", ice:"얼음",
  fighting:"격투", poison:"독", ground:"땅", flying:"비행", psychic:"에스퍼",
  bug:"벌레", rock:"바위", ghost:"고스트", dragon:"드래곤", dark:"악",
  steel:"강철", fairy:"페어리"
};

const TYPE_COLORS = {
  normal:"#8e8e7a", fire:"#f04436", water:"#2788e8", electric:"#e9b915",
  grass:"#40a956", ice:"#54c7cf", fighting:"#c43d34", poison:"#9146a4",
  ground:"#bd8844", flying:"#7796df", psychic:"#e84b82", bug:"#85a52d",
  rock:"#9a813d", ghost:"#62569a", dragon:"#5d49c9", dark:"#554b48",
  steel:"#718a98", fairy:"#dc77a5"
};

const state = {
  playerTeam: [], enemyTeam: [], playerIndex: 0, enemyIndex: 0,
  busy: false, finished: false, wins: 0, losses: 0
};

/* STEP 1 · 랜덤 포켓몬 한 마리 표시 — 약 30줄
   구현 기능:
   - 랜덤 번호 생성
   - PokeAPI 호출
   - 이름, 이미지, 타입, HP를 player 영역에 표시
   확인 방법: Console에서 showRandomPokemon()을 실행할 때마다 다른 포켓몬이 보입니다. */

function randomNumber(min, max) {
  // TODO 1-1
  return Math.floor(Math.random()*(max - min + 1 ))+ min;
}


async function fetchPokemon(id) {
  // TODO 1-2: fetch → 응답 검사 → JSON 반환
  const response = await fetch(API_URL + id);
  if(!response.ok) throw new Error(`API 오류 : ${response.status}`);
  return response.json();
  
}

function statOf(data, statName) {
  // TODO 1-3: data.stats.find()로 능력치 반환
  return data.stats.find((item)=> item.stat.name === statName)?.base_stat ?? 50;
}

function typeBadges(types) {
  // TODO 1-4: map/join으로 타입 배지 HTML 생성
  return types.map((type)=>
`<spanclass = "type" style = "background:${TYPE_COLORS[type]}">${TYPE_NAMES[type]}</span>`
).join("");
}

async function showRandomPokemon() {
  // TODO 1-5: 한 마리를 받고 player 영역에 직접 표시
  const data = await fetchPokemon(randomNumber(1,493));
  const pokemon = createPokemon(data);
  state.playerTeam = [pokemon];
  state.playerIndex = 0;
  renderFighter("player");
}

/* STEP 2 · 랜덤 3대3 팀 만들기 — 약 35줄
   구현 기능:
   - API 데이터를 게임용 포켓몬 객체로 변환
   - 중복 없는 번호 6개 생성
   - Promise.all로 동시에 호출
   - 양쪽 팀 미니 카드 표시
   확인 방법: 새 게임 버튼을 누르면 양쪽에 3마리씩 나타납니다. */

function createPokemon(data) {
  // TODO 2-1: name, image, types, maxHp, hp, attack, defense, speed, moves 반환

  const hp = 90 + Math.round(statOf(data, "hp") * 0.6);
  const types = data.types.map((item)=> item.type.name);
  return{ 
    id : data.id,
    name : data.name,
    image: data.sprites.other?.["official-artwork"]?.front_default ?? data.sprites.front_default,
    types,
    maxHp : hp,
    hp,
    attack: statOf(data, "attack"),
    defense: statOf(data, "defense"),
    speed: statOf(data,"speed"),
    moves:[
        {name : `${TYPE_NAMES[types[0]]} 공격` , type: types[0],power : 52},
        {name : "몸통박치기" , type : "normal" , power : 45},
        {name : "필살의 일격" , type : types[0], power : 65}
    ]
  }
}

function uniqueIds(count) {
  // TODO 2-2: Set을 이용해 중복 없는 번호 배열 반환
  const ids = new Set();
  while(ids.size < count) ids.add(randomNumber(1,493));
  return [...ids];
}

async function createRandomTeams() {
  // TODO 2-3: 6마리를 동시에 받은 뒤 state의 두 팀에 3마리씩 저장
  const data= await Promise.all(uniqueIds(6).map(fetchPokemon));
  state.playerTeam = data.slice(0,3).map(createPokemon);
  state.enemyTeam = data.slice(3,6).map(createPokemon);
}

function current(side) {
  // TODO 2-4: player 또는 enemy의 현재 포켓몬 반환
  const team = state[`${side}Team`];
  return team[state[`${side}Index`]];
}

function renderTeam(side) {
  // TODO 2-5: active와 fainted class를 포함한 미니 카드 생성
  const team = state[`${side}Team`];
  const activeIndex = state[`${side}Index`];
  $(`${side}Team`).innerHTML = team.map((pokemon, index)=>
`<span class= "mini ${index === activeIndex ? "active" : ""} ${pokemon.hp <= 0 ? "fainted" : ""}">
  <img src = "${pokemon.image}" alt = "${pokemon.name}">
    </span>`


).join("");
}

/* STEP 3 · 기술 버튼과 HP 공격 — 약 35줄
   구현 기능:
   - 현재 포켓몬 정보 렌더링
   - 기술 버튼 생성
   - 버튼을 누르면 상대 HP 감소
   - HP가 음수가 되지 않게 제한
   확인 방법: 기술 버튼을 누를 때 상대 HP 숫자와 초록색 바가 줄어듭니다. */

function renderFighter(side) {
  // TODO 3-1: 현재 포켓몬의 이름, 이미지, 타입, HP와 바 업데이트

  const pokemon = current(side);

  if(!(pokemon)) return;

  $(`${side}Name`).textContent = pokemon.name;
  $(`${side}Image`).src = pokemon.image;
  $(`${side}Types`).innerHTML = typeBadges(pokemon.types);
  $(`${side}HpText`).textContent = `${pokemon.hp} / ${pokemon.maxHp}`;
  const hpPercent = (pokemon.hp / pokemon.maxHp) * 100;
  $(`${side}Hp`).style.width = `${hpPercent}%`;
  $(`${side}Hp`).style.background = hpPercent < 30 ?  "#ff5260" : "#4cd964";
   
}

function renderMoves() {
  // TODO 3-2: 기술 버튼 HTML과 클릭 이벤트 생성
  const pokemon = current("player");
  if(!pokemon) return;
  $("moveButtons").innerHTML = pokemon.moves.map((move, index)=>
    `<button data-index=${index}" ${state.busy || state.finished ? "disabled" : ""}>
${move.name}<small>${TYPE_NAMES[move.type]} / ${move.power}</small></button>`
).join("");
document.querySelectorAll("#moveButtons button").forEach((button)=>{
    button.addEventListener("click",()=> battleTurn(Number(button.dataset.index)));
}
)};
  
function render() {
  // TODO 3-3: 양쪽 fighter, team, move를 모두 다시 그림
    renderFighter("player");
    renderFighter("enemy");
    renderTeam("player");
    renderTeam("enemy");
    renderMoves();
}

function basicDamage(attacker, defender, move) {
  // TODO 3-4: 위력 × 공격력 ÷ 방어력을 이용한 정수 피해량
  return Math.max(1, Math.floor(move.power * attacker.attack / Math.max(35, defender.defense) * 0.7));
}

function playerAttack(moveIndex) {
  // TODO 3-5: 선택 기술로 enemy HP 감소, 로그 작성, render 호출
  const attacker = current("Player");
    const defender = current("Enemy");
    const move = attacker.moves[moveIndex];
    defender.hp = Math.max(0, defender.hp - basicDamage(attacker, defender, move)); 
    writeLog(`${attacker.name}의 ${move.name}!`);
    render();
}

/* STEP 4 · 타입 상성과 랜덤 데미지 — 약 30줄
   구현 기능:
   - 불꽃/물/풀/전기 등 약점표
   - 약점 1.6배, 반감 0.65배, 무효 0배
   - 0.85~1.0 랜덤 데미지
   - 효과가 굉장함/별로임 메시지
   확인 방법: 기술 타입과 상대 타입에 따라 피해량과 로그가 달라집니다. */

const STRONG_AGAINST = {
  fire:["grass","ice","bug","steel"], water:["fire","ground","rock"],
  electric:["water","flying"], grass:["water","ground","rock"],
  ice:["grass","ground","flying","dragon"], fighting:["normal","ice","rock","dark","steel"],
  ground:["fire","electric","poison","rock","steel"], flying:["grass","fighting","bug"],
  psychic:["fighting","poison"], rock:["fire","ice","flying","bug"],
  ghost:["psychic","ghost"], dragon:["dragon"], dark:["psychic","ghost"],
  steel:["ice","rock","fairy"], fairy:["fighting","dragon","dark"]
};

function effectiveness(moveType, targetTypes) {
  // TODO 4-1: targetTypes를 순회해 배율 계산
  let multiplier = 1;
  targetTypes.forEach((targetTypes)=>{
    if(STRONG_AGAINST[moveType]?.includes(targetTypes)) multiplier *= 1.6;
    if(RESISTS[moveType]?.includes(targetTypes)) multiplier *= 0.65;
    if(moveType === "electric" && targetTypes === "ground") multiplier *= 0;
    if(moveType === "ground" && targetTypes === "flying") multiplier *= 0;
    if(moveType === "normal" && targetTypes === "ghost") multiplier *= 0;
});
return multiplier;
}

function calculateDamage(attacker, defender, move) {
    const randomFactor = 0.85+ Math.random() * 0.15;
    const multiplier = effectiveness(move.type, defender.types);
    const damage = Math.round((basicDamage(attacker, defender,move) * randomFactor * multiplier));
    return {damage : multiplier === 0 ? 0 : Math.max(1,damage), multiplier};
  // TODO 4-2: 기본 데미지 × 랜덤 보정 × 상성 배율
}

function hitMessage(attacker, move, damage, multiplier) {
  // TODO 4-3: 공격 정보와 상성 설명 문자열 반환
  const effect = multiplier > 1 ? "굉장히 효과적이다!" : multiplier < 1 ? "별로 효과가 없다..." : "";
  return `${attacker.name}의 ${move.name}! ${damage}의 피해. ${effect}`;
}

/* STEP 5 · 상대 반격과 속도 기반 턴 — 약 40줄
   구현 기능:
   - 상대가 랜덤 기술 선택
   - speed가 빠른 포켓몬부터 공격
   - 첫 공격에 쓰러지면 반격하지 않음
   - 애니메이션 대기 중 버튼 중복 클릭 방지
   확인 방법: 한 번 클릭할 때 양쪽이 순서대로 공격하며 빠른 쪽이 먼저 움직입니다. */

function writeLog(message) {
  // TODO 5-1: battleLog의 맨 앞에 새 문장 추가
  $("battleLog").insertAdjacentHTML("afterbegin", `<p>${message}</p>`);
}

function wait(ms) {
  // TODO 5-2: Promise와 setTimeout 사용
  return new Promise((resolve)=> setTimeout(resolve, ms));
}

async function performAttack(attacker, defender, move) {
  // TODO 5-3: 데미지 적용 → 로그 → render → 잠깐 대기
  const result = calculateDamage(attacker, defender, move);
  defender.hp = Math.max(0, defender.hp - result.damage);
  writeLog(hitMessage(attacker, move, result.damage, result.multiplier));
  render();
  await wait(500);
}

function randomEnemyMove() {
  // TODO 5-4
  const moves = current("enemy").moves;
  return moves[randomNumber(0, moves.length - 1)];
}

async function battleTurn(moveIndex) {
  // TODO 5-5: busy 검사, speed 순서 결정, 두 공격과 쓰러짐 검사, finally 처리
  if(state.busy || state.finished) return;
  state.busy = true;
  renderMoves();
  try {
    const player = current("player");
    const enemy = current("enemy");
    const action = player.speed >= enemy.speed ?
      [{side:"player", atttacker:player,defender:enemy, move:player.moves[moveIndex]},
      {side:"enemy", atttacker:enemy,defender:player, move:randomEnemyMove()}]
      :
        [{side:"enemy", atttacker:enemy,defender:player, move:randomEnemyMove()},
        {side:"player", atttacker:player,defender:enemy, move:player.moves[moveIndex]}];

        for(const act of action)
            {
                if(act.defender.hp <= 0 || state.finished) continue;
                await performAttack(act.atttacker, act.defender, act.move);
                if(act.defender.hp <= 0) await handleFaint(act.side === "player" ? "enemy" : "player");
            }
        }
            finally
            {
                state.busy = false;
                render();
            }
}

/* STEP 6 · 3대3 교체와 전적 저장 — 약 30줄
   구현 기능:
   - 쓰러지면 다음 포켓몬 자동 등장
   - 팀 전체가 쓰러지면 승패 결정
   - localStorage에 승/패 누적 저장
   - 새 게임 버튼으로 상태 초기화
   확인 방법: 세 마리를 모두 쓰러뜨리면 전적이 저장되고 새 게임 후에도 유지됩니다. */

async function handleFaint(side) {
  // TODO 6-1: 인덱스 증가 → 팀 종료 확인 → 교체 로그와 render
  const defected = current(side);
  writeLog(`${defected.name}이 쓰러졌다!`); 
  state[`${side}Index`] += 1;
  if(state[`${side}Index`] >= state[`${side}Team`].length) 
    {
        finish(side === "enemy");
    }
    await wait(350);
    writeLog(`${current(side).name}이(가) 등장했다!`);
    render();
}

function finish(playerWon) {
  // TODO 6-2: finished 설정, localStorage 전적 갱신, 결과 로그
  state.finished = true;
  const key = playerWon ? "wins" : "losses";
  state[key] += 1;
  localStorage.setItem("pokemonBattleRecord", JSON.stringify({wins:state.wins, losses:state.losses}));
}

function loadRecord() {
  // TODO 6-3: 저장된 wins/losses를 state에 불러오기
  const saved = JSON.parse(localStorage.getItem("pokemonBattleRecord") || "{}");
  state.wins = saved.wins ?? 0;
  state.losses = saved.losses ?? 0;
}

async function startGame() {
  // TODO 6-4: 로딩 표시, createRandomTeams, 인덱스/상태 초기화, render, 오류 처리
  if(state.busy)return;
  state.busy=true;
  state.finished=false;

  $("newGame").disabled = true;
  $("notice").textContent = "포켓몬을 불러오는 중입니다...";

  try
  {
    await createRandomTeams();
    state.playerIndex = 0;
    state.enemyIndex = 0;
    $("battleLog").innerHTML = "";
    writeLog(`배틀 시작! 현재 전적${state.wins}승 ${state.losses}패`);
    $("notice").textContent = "기술을 선택하세요!";
  }
  catch(error)
  {
    $("notice").textContent = `불러오기 실패 : ${error.message}`;  
  }
  finally
  {
    state.busy = false;
    $("newGame").disabled = false;
    render();
  }
}

// TODO 6-5: newGame 버튼에 startGame 연결

// 단계가 끝나면 Console에서 markStep(번호)를 실행해 진행 표시를 켜세요.
function markStep(step) {
  document.querySelector(`[data-step="${step}"]`)?.classList.add("done");
  $("notice").textContent = `STEP ${step} 기능 완성! 브라우저에서 동작을 확인하세요.`;
}

loadRecord();
$("newGame").addEventListener("click",startGame);
