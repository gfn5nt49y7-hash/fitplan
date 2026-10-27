import type { KinesiologyModule } from "@fitplan/contracts";

export const kinesiologyModules: KinesiologyModule[] = [
  {
    id: "shoulder",
    title: "肩关节与肩带",
    subtitle: "上肢活动的方向控制中心",
    summary:
      "肩部不是单一关节在工作。盂肱关节负责上臂大范围转动，肩胛骨和锁骨负责给肩关节提供活动空间。抬手时肩胛骨需要向上旋转，肱骨头也应尽量保持稳定。",
    keyFunction: "把躯干产生的力量传到手臂，同时让推、拉和举过头顶成为可能。",
    movements: [
      {
        id: "shoulder-flexion",
        name: "肩屈",
        englishName: "Shoulder flexion",
        plane: "矢状面",
        description: "上臂向身体前方抬起。举臂到前方、推举上行阶段都包含肩屈。",
        exerciseExamples: ["哑铃肩上推举", "跪姿俯卧撑"]
      },
      {
        id: "shoulder-extension",
        name: "肩伸",
        englishName: "Shoulder extension",
        plane: "矢状面",
        description: "上臂从前方回到身体后侧。划船回拉和把重量拉向髋部时尤其明显。",
        exerciseExamples: ["坐姿划船", "哑铃单臂划船"]
      },
      {
        id: "shoulder-abduction",
        name: "肩外展",
        englishName: "Shoulder abduction",
        plane: "额状面",
        description: "上臂向身体侧面抬起。侧平举是最直接的肩外展动作，推举也会伴随外展。",
        exerciseExamples: ["哑铃侧平举", "哑铃肩上推举"]
      },
      {
        id: "shoulder-horizontal-adduction",
        name: "肩水平内收",
        englishName: "Horizontal adduction",
        plane: "水平面",
        description: "上臂在接近肩高的位置由外向内合拢。卧推、俯卧撑和飞鸟的推合阶段都包含这一动作。",
        exerciseExamples: ["哑铃卧推", "跪姿俯卧撑", "哑铃飞鸟"]
      },
      {
        id: "shoulder-horizontal-abduction",
        name: "肩水平外展",
        englishName: "Horizontal abduction",
        plane: "水平面",
        description: "上臂沿水平面向身体外侧打开。面拉和划船时，它常与肩胛后缩、肘屈一起出现。",
        exerciseExamples: ["绳索面拉", "坐姿划船"]
      },
      {
        id: "shoulder-external-rotation",
        name: "肩外旋",
        englishName: "External rotation",
        plane: "水平面",
        description: "上臂骨在肩关节内向外旋转。它常被忽略，但对肩关节稳定和推拉动作的平衡很重要。",
        exerciseExamples: ["绳索面拉"]
      }
    ],
    selectionLogic: [
      "想练胸部：选择包含肩水平内收和肘伸的动作，例如卧推、俯卧撑和飞鸟。",
      "想练背部：选择肩伸或肩水平外展，同时配合肘屈、肩胛后缩，例如划船和下拉。",
      "想练三角肌中束：侧平举直接体现肩外展；不要只靠卧推代替肩部训练。",
      "想兼顾肩部稳定：在推拉之外补充面拉，训练肩水平外展、肩外旋和肩胛控制。"
    ],
    safetyNotes:
      "肩屈和肩外展在举过头顶时通常共同发生。不要把抬高手臂简单理解为只有一块肌肉在拉；如果肩部疼痛，应先减小活动范围并寻求专业评估。"
  },
  {
    id: "elbow",
    title: "肘关节与前臂",
    subtitle: "力量传递和抓握方向",
    summary:
      "肘关节主要完成屈伸，前臂负责旋转方向。肘部本身稳定，但它决定手臂能否把肩部和躯干的力量传到手上，也决定肱二头肌和肱三头肌在什么姿势下更有效。",
    keyFunction: "控制手与前臂的位置，并在推、拉、提、抱等动作中传递力量。",
    movements: [
      {
        id: "elbow-flexion",
        name: "肘屈",
        englishName: "Elbow flexion",
        plane: "矢状面",
        description: "前臂靠近上臂。弯举、划船和把重量拉近身体时都依赖肘屈。",
        exerciseExamples: ["哑铃弯举", "坐姿划船", "哑铃单臂划船"]
      },
      {
        id: "elbow-extension",
        name: "肘伸",
        englishName: "Elbow extension",
        plane: "矢状面",
        description: "前臂远离上臂、手臂变直。俯卧撑、卧推和绳索下压的末段都需要肘伸。",
        exerciseExamples: ["绳索下压", "哑铃卧推", "跪姿俯卧撑"]
      },
      {
        id: "forearm-supination",
        name: "前臂旋后",
        englishName: "Supination",
        plane: "水平面",
        description: "掌心由朝向身体转为朝上。肱二头肌在肘屈同时进行旋后时通常更容易参与。",
        exerciseExamples: ["哑铃弯举"]
      }
    ],
    selectionLogic: [
      "想让肱二头肌承担更多：选择肘屈动作，并保持上臂相对稳定，避免靠身体摆动。",
      "想让肱三头肌承担更多：选择肘伸动作，例如下压或俯卧撑，固定上臂位置更容易判断是否借力。",
      "复合动作和单关节动作不是互相替代：卧推和俯卧撑提供整体推力，弯举和下压更容易补足局部训练量。"
    ],
    safetyNotes:
      "肘部疼痛可能来自训练量、握法或肩胛位置，不一定只是手臂肌肉太弱。出现持续疼痛或麻木时应停止加重动作。"
  },
  {
    id: "hip",
    title: "髋关节",
    subtitle: "下肢力量和髋部折叠的核心",
    summary:
      "髋关节是球窝关节，可以在多个平面运动。下肢训练的关键区别，往往不是动作名字，而是髋和膝分别贡献了多少角度：深蹲更像髋屈伸与膝屈伸的组合，硬拉则更接近髋铰链。",
    keyFunction: "连接躯干与下肢，产生伸髋力量，并在单腿和负重时保持骨盆稳定。",
    movements: [
      {
        id: "hip-flexion",
        name: "髋屈",
        englishName: "Hip flexion",
        plane: "矢状面",
        description: "大腿向躯干靠近，或骨盆在大腿上方前倾。下蹲下行、抬膝和箭步蹲前侧髋部都会出现髋屈。",
        exerciseExamples: ["徒手深蹲", "反向箭步蹲", "死虫式"]
      },
      {
        id: "hip-extension",
        name: "髋伸",
        englishName: "Hip extension",
        plane: "矢状面",
        description: "大腿向身体后方移动，或在站起时把骨盆推向前方。臀桥和蹲起都需要明显髋伸。",
        exerciseExamples: ["臀桥", "徒手深蹲", "反向箭步蹲"]
      },
      {
        id: "hip-abduction",
        name: "髋外展",
        englishName: "Hip abduction",
        plane: "额状面",
        description: "大腿向身体外侧移动。单腿动作中，臀中肌等结构需要控制骨盆，避免一侧塌陷。",
        exerciseExamples: ["反向箭步蹲", "徒手深蹲"]
      },
      {
        id: "hip-hinge",
        name: "髋铰链组合",
        englishName: "Hip hinge",
        plane: "多平面基础模式",
        description: "以髋向后移动为主，膝只轻微弯曲。罗马尼亚硬拉比深蹲更能体现髋铰链，重点是大腿后侧和臀部。",
        exerciseExamples: ["哑铃罗马尼亚硬拉"]
      }
    ],
    selectionLogic: [
      "想练臀腿整体力量：优先选择深蹲、箭步蹲等同时包含髋屈伸和膝屈伸的动作。",
      "想练臀部和大腿后侧：选择臀桥或髋铰链动作，把注意力放在伸髋而非单纯弯膝。",
      "想让动作更稳定：单腿动作不只练力量，还会训练髋外展和骨盆控制。"
    ],
    safetyNotes:
      "髋部训练不等于追求蹲得越深越好。保持背部可控、膝盖方向稳定，并根据髋关节活动度选择适合的深度。"
  },
  {
    id: "knee",
    title: "膝关节",
    subtitle: "承重、弯曲与伸直",
    summary:
      "膝关节主要完成屈伸，并依赖髋和踝共同分配压力。深蹲、箭步蹲和站起都是髋、膝、踝的联合运动；只盯住膝盖本身，很难理解动作为什么这样设计。",
    keyFunction: "承受体重、缓冲落地，并把下肢力量传到地面。",
    movements: [
      {
        id: "knee-flexion",
        name: "膝屈",
        englishName: "Knee flexion",
        plane: "矢状面",
        description: "脚跟靠近臀部或大腿后侧。下蹲、箭步蹲下沉和落地缓冲都包含膝屈。",
        exerciseExamples: ["徒手深蹲", "反向箭步蹲"]
      },
      {
        id: "knee-extension",
        name: "膝伸",
        englishName: "Knee extension",
        plane: "矢状面",
        description: "膝盖变直、身体站起时发生。站起阶段需要膝伸与髋伸共同完成。",
        exerciseExamples: ["徒手深蹲", "反向箭步蹲"]
      },
      {
        id: "knee-single-leg-control",
        name: "单腿膝稳定",
        englishName: "Single-leg knee control",
        plane: "多平面稳定",
        description: "单腿承重时控制膝盖不向内塌、不锁死，是箭步蹲价值高于单纯坐姿伸膝的重要原因。",
        exerciseExamples: ["反向箭步蹲"]
      }
    ],
    selectionLogic: [
      "想练大腿前侧和整体下肢：深蹲提供髋、膝、踝协同的复合刺激。",
      "想练单侧平衡与骨盆控制：反向箭步蹲比双腿动作增加稳定需求。",
      "蹲下时膝盖略向前并不可怕；关键是膝盖和脚尖方向一致、脚掌稳定，而不是刻意把膝盖锁在脚趾后面。"
    ],
    safetyNotes:
      "膝关节本身结构复杂，若出现肿胀、卡住、打软腿或持续疼痛，应停止训练并寻求医疗或康复专业评估。"
  },
  {
    id: "ankle",
    title: "踝关节与足部",
    subtitle: "连接地面与下肢的最后一个环节",
    summary:
      "踝关节让小腿向前移动并让脚掌蹬地。深蹲时踝背屈不足，身体可能通过脚跟抬起、膝盖内扣或躯干过度前倾来代偿；提踵则更直接地训练踝跖屈。",
    keyFunction: "提供脚踝活动度、落地缓冲和向地面发力的支点。",
    movements: [
      {
        id: "ankle-dorsiflexion",
        name: "踝背屈",
        englishName: "Dorsiflexion",
        plane: "矢状面",
        description: "脚尖靠近小腿，膝盖向前移动时会出现。深蹲下行和箭步蹲前腿需要足够的踝背屈。",
        exerciseExamples: ["徒手深蹲", "反向箭步蹲"]
      },
      {
        id: "ankle-plantarflexion",
        name: "踝跖屈",
        englishName: "Plantarflexion",
        plane: "矢状面",
        description: "脚尖向下、脚跟抬起。提踵和站起末段的蹬地都包含踝跖屈。",
        exerciseExamples: ["站姿提踵", "徒手深蹲"]
      },
      {
        id: "ankle-stability",
        name: "足踝稳定",
        englishName: "Foot-ankle stability",
        plane: "多平面稳定",
        description: "保持大脚趾、脚掌外侧和脚跟形成的稳定支撑，避免足弓塌陷或脚掌滚动。",
        exerciseExamples: ["反向箭步蹲", "站姿提踵"]
      }
    ],
    selectionLogic: [
      "想练小腿：提踵直接对应踝跖屈，控制下放比快速弹跳更容易记录训练质量。",
      "想改善深蹲：先观察踝背屈和脚掌支撑，不要只通过加大重量掩盖活动度不足。",
      "单腿动作中脚掌是否稳定，会直接影响膝和髋的控制。"
    ],
    safetyNotes:
      "脚踝扭伤后不要只追求尽快负重。若仍有明显疼痛、肿胀或关节不稳，应先评估再恢复训练。"
  },
  {
    id: "trunk",
    title: "躯干与核心",
    subtitle: "先稳定，再把力量传出去",
    summary:
      "核心不只是腹肌，也不只负责卷腹。跑步、深蹲和推举时，躯干需要抵抗过度伸展、旋转和侧屈，同时保持呼吸。核心训练的第一任务是稳定身体，而不是产生尽可能大的动作幅度。",
    keyFunction: "连接上下肢、保持脊柱可控，并让髋部产生的力量传到手臂和地面。",
    movements: [
      {
        id: "trunk-anti-extension",
        name: "躯干抗伸展",
        englishName: "Anti-extension",
        plane: "矢状面稳定",
        description: "抵抗腰部过度前凸。平板支撑和死虫式通过保持肋骨与骨盆位置来训练这一能力。",
        exerciseExamples: ["平板支撑", "死虫式"]
      },
      {
        id: "trunk-anti-rotation",
        name: "躯干抗旋转",
        englishName: "Anti-rotation",
        plane: "水平面稳定",
        description: "在单侧负重或四肢移动时保持躯干不左右旋转。单臂负重、单侧提拉都可以训练它。",
        exerciseExamples: ["死虫式", "哑铃单臂划船"]
      },
      {
        id: "trunk-brace-breathing",
        name: "支撑与呼吸",
        englishName: "Bracing with breathing",
        plane: "多平面稳定",
        description: "收紧腹部并不等于憋气。训练时既要建立腹压，也要保持呼吸和肋骨位置可控。",
        exerciseExamples: ["平板支撑", "臀桥", "死虫式"]
      }
    ],
    selectionLogic: [
      "想提升稳定性：选择需要维持姿势而非快速卷腹的动作，例如平板支撑和死虫式。",
      "想练腹部外观和力量：不能只做静态支撑，还要在计划中安排髋屈、躯干屈曲或其他负荷动作。",
      "复合力量动作本身也需要核心：深蹲、箭步蹲和推举时，核心主要负责把力量传过去。"
    ],
    safetyNotes:
      "核心内容是一般训练教育，不用于诊断腰痛。出现放射性疼痛、麻木或持续加重的不适，应寻求专业医疗评估。"
  }
];
