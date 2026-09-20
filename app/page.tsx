import Replay from './Replay';

export default function Home() {
  return <>
    <header className="nav"><a className="wordmark" href="#">N-TacVLA<span className="dot" /></a><nav aria-label="主导航"><a href="#overview">项目概览</a><a href="#replay">数据回放</a><a href="#team">作者与单位</a></nav><span className="nav-note">RESEARCH PROJECT · 2026</span></header>
    <main>
      <section className="hero wrap">
        <div className="eyebrow"><span className="dot" /> VISUAL · TACTILE · PROXIMITY</div>
        <h1>N-<span>Tac</span>VLA</h1>
        <div className="hero-intro"><h2>视觉与触觉，<br />在真实交互中相遇。</h2><div><p>探索人形机器人的多模态交互。<br />从第一视角视频，到指尖接触与接近觉，<br />回看同一段遥操作中的动作与感知。</p><a className="button" href="#replay">探索数据回放 <span>↗</span></a></div></div>
        <div className="hero-camera"><img src="/media/stereo.jpg" alt="G1 头部双目相机记录的实验场景与双手" /><div className="camera-top"><span>G1 / EGOCENTRIC VIEW</span><span>RECORDED DEMONSTRATION</span></div><div className="camera-bottom"><span>两只眼睛，一个交互现场。</span><span>HEAD STEREO / L + R</span></div></div>
        <div className="author-line" id="team"><span className="author">Yu Sun</span><span>戴盟机器人公司</span><span>大湾区大学</span><span>哈尔滨工业大学深圳</span></div>
      </section>
      <section className="section wrap overview" id="overview"><div className="section-label">01 / THE PROJECT</div><div><h2>让动作可见，<br />让接触有迹可循。</h2><p className="lead">N-TacVLA 项目页展示 G1 遥操作与多模态数据采集。头部双目、腕部相机、触觉与接近觉记录，为观察双手交互提供互补视角。</p><div className="facts"><div><strong>G1</strong><span>人形机器人平台</span></div><div><strong>双手</strong><span>灵巧手交互</span></div><div><strong>多模态</strong><span>视频与接触记录</span></div></div></div></section>
      <section className="section wrap" id="replay"><div className="section-label">02 / EXPLORE THE RECORDING</div><div className="replay-intro"><h2>看见动作，<br />读懂每一刻接触。</h2><p className="lead">播放一段真实采集，或拖动时间轴。<br />从头部与腕部视角，关联双手的触觉与接近觉。</p></div><Replay/></section>
      <section className="section wrap" id="system"><div className="section-label">03 / THE COLLECTION SYSTEM</div><h2>从人的动作，<br />到可回看的多模态记录。</h2><div className="pipeline"><article><span>01 / INPUT</span><h3>遥操作输入</h3><p>HTC 跟踪身体动作，Wuji 手套提供双手输入。</p></article><article><span>02 / INTERACTION</span><h3>G1 与灵巧手</h3><p>SONIC 全身控制与 Inspire G2 双手完成机器人交互。</p></article><article><span>03 / OBSERVATION</span><h3>多视角与触觉</h3><p>记录头部双目、双腕视频、触觉与接近觉。</p></article><article><span>04 / REPLAY</span><h3>时间轴回放</h3><p>按记录时间浏览动作与接触，保留采集结果与数据质量标记。</p></article></div></section>
    </main><footer className="wrap"><a className="wordmark" href="#">N-TacVLA<span className="dot" /></a><span>Yu Sun · 2026</span><a href="#">回到顶部 ↑</a></footer>
  </>;
}
