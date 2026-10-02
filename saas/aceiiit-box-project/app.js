// app.js - the page: course list, summary card, buttons. Talks to box.js.

// ---------- your courses (replace with your real list) ----------
const courses = [
  { id: "class", icon: "🎓", tag: "FULL COURSE", title: "Class + Notes", price: 1499, desc: "Live classes with UGEE faculty + complete notes bundle" },
  { id: "mock", icon: "📝", tag: "MOCK TESTS", title: "Paid Mock Series", price: 599, desc: "2 free on signup + 4 full-length UGEE mocks with analytics" },
  { id: "interview", icon: "🎙️", tag: "INTERVIEW PREP", title: "Interview Guidance", price: 699, desc: "PI prep, portfolio review, SOP + mock interviews" }
];

const listDiv = document.getElementById("courseList");
const summaryDiv = document.getElementById("summary");
const badge = document.getElementById("badge");
const continueBtn = document.getElementById("continueBtn");
const editBtn = document.getElementById("editBtn");
let selected = [];
let rows = {};

for (let i = 0; i < courses.length; i++) {
  const c = courses[i];
  const row = document.createElement("div");
  row.className = "course";
  row.innerHTML =
    '<div class="check">✓</div>' +
    '<div class="icon">' + c.icon + '</div>' +
    '<div class="mid"><div class="tag">' + c.tag + '</div><div class="name">' + c.title + '</div><div class="desc">' + c.desc + '</div></div>' +
    '<div class="cost"><b>₹' + c.price + '</b><div>ONE-TIME</div></div>';
  row.addEventListener("click", function () {
    if (getBoxMode() !== "open") return;
    toggleCourse(c);
  });
  listDiv.appendChild(row);
  rows[c.id] = row;
}

function toggleCourse(c) {
  const index = selected.indexOf(c.id);
  if (index === -1) {
    selected.push(c.id);
    rows[c.id].classList.add("on");
    addToBox(c.id, c.tag, c.title, "₹" + c.price, false, 0);
    if (selected.length === 1) {
      // free study material drops in right after the first course
      addToBox("study", "BONUS", "Study Material", "", true, 0.5);
    }
  } else {
    selected.splice(index, 1);
    rows[c.id].classList.remove("on");
    removeFromBox(c.id);
    if (selected.length === 0) {
      removeFromBox("study");
    }
  }
  updateSummary();
}

function updateSummary() {
  let total = 0;
  let html = "";
  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];
    if (selected.indexOf(c.id) !== -1) {
      total += c.price;
      html += '<div class="row"><span>' + c.icon + ' ' + c.title + '</span><span>₹' + c.price + '</span></div>';
    }
  }
  if (selected.length > 0) {
    html += '<div class="row free"><span>📚 Study Material</span><span class="pill">FREE</span></div>';
  } else {
    html = '<div class="row">No courses selected yet</div>';
  }
  html += '<div class="total"><span>Total</span><span>₹' + total + '</span></div>';
  summaryDiv.innerHTML = html;

  badge.textContent = selected.length;
  badge.style.display = selected.length > 0 ? "flex" : "none";
  continueBtn.disabled = selected.length === 0;
  if (selected.length > 0) {
    continueBtn.textContent = "CONTINUE — ₹" + total + " →";
  } else {
    continueBtn.textContent = "CONTINUE →";
  }
}

function setLocked(locked) {
  for (const id in rows) {
    if (locked) {
      rows[id].classList.add("locked");
    } else {
      rows[id].classList.remove("locked");
    }
  }
  continueBtn.disabled = locked || selected.length === 0;
  editBtn.style.display = "none";
}

continueBtn.addEventListener("click", function () {
  if (getBoxMode() !== "open") return;
  setLocked(true);
  continueBtn.textContent = "PACKING YOUR ORDER...";
  checkoutBox(function () {
    continueBtn.textContent = "ORDER PACKED ✓";
    editBtn.style.display = "block";
    // put your real checkout here, e.g. window.location.href = "/checkout";
  });
});

editBtn.addEventListener("click", function () {
  editBtn.style.display = "none";
  reopenBox();
  updateSummary();
});

// start once the logo has loaded
const logoImage = new Image();
logoImage.onload = function () {
  initBox(document.getElementById("stage"), logoImage, function () {
    setLocked(false);
  });
  updateSummary();
};
logoImage.src = LOGO_SRC;
