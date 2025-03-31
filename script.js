if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then((registration) => {
      console.log("SW Registered.");
      console.log(registration);
    })
    .catch((error) => {
      console.log("SW Registration Failed!");
      console.log(error);
    });
}

class LinkList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const template = document.createElement("template");
    template.id = "link-list-template";
    template.innerHTML = `
        <style>
          .link-item {
            padding: 8px;
            background-color: #eee;
            margin-bottom: 5px;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .link-item span {
            width: 70%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 16px;
          }
          .create-link-wrapper {
            width: 100%;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
          }
          input[type="text"] {
            padding: 8px;
            width: 300px;
            font-size: 14px;
            border-radius: 4px;
            border: 1px solid #ccc;
          }
          select {
            padding: 8px 15px;
            width: 150px;
            font-size: 14px;
            border-radius: 4px;
            border: 1px solid #ccc;
          }
          button {
            padding: 8px 15px;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 4px;
            height: 36px;
          }
          button:hover {
            background-color: #45a049;
          }
          .edit-button {
            padding: 8px 15px;
            background-color: rgb(105, 95, 241);
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 4px;
          }
          .share-button {
            padding: 8px 15px;
            background-color: rgb(105, 95, 241);
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 4px;
          }
          .delete-button {
            padding: 8px 15px;
            background-color: rgb(248, 107, 97);
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 4px;
          }
          .edit-button:hover, .share-button:hover {
            background-color: rgb(33, 18, 245);
          }
          .delete-button:hover {
            background-color: #d32f2f;
          }
          .category-card {
            padding: 10px;
            margin-bottom: 20px;
            background-color: #f9f9f9;
            border-radius: 6px;
            border: 1px solid #ccc;
          }
          .category-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .container-Btn {
            display: flex;
            justify-content: space-between;
            gap: 10px;
          }
          #listLinks {
            width: 100%;
          }
          .error-message {
          width: fit-content;
          margin: 0 auto;
          padding: 10px;
          border-radius: 5px;
            color: red;
            font-size: 14px;
            margin-top: 10px;
            margin-bottom: 10px;
            text-align: center;
            background-color: #f9f9f9;
          }
            .title-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: white;
            }
            .title-wrapper h2 {
            margin: 5px 0;
            }

          @media screen and (min-width: 700px) {
  .container {
  width: 60vw;
    margin: 0 auto;
  }
    @media screen and (min-width: 1200px) {
  .container {
  width: 50vw;
    margin: 0 auto;
  }
}
        </style>
        <div class="container">
          <div class="create-link-wrapper">
            <div class="title-wrapper">
              <slot name="title"></slot>
              <slot name="description"></slot>
            </div>
            <div>
              <slot name="input"></slot>
              <slot name="category-select"></slot>
              <slot name="add-button"></slot>
              </div>
            </div>

          <div id="errorMessage" class="error-message" style="display: none;">
            Please enter a URL and select a category.
          </div>

          <div id="listLinks"></div>

            <slot name="link-card"></slot>
        </div>
      `;

    const templateClone = template.content.cloneNode(true);

    const titleSlot = templateClone.querySelector("slot[name='title']");
    const descriptionSlot = templateClone.querySelector(
      "slot[name='description']"
    );
    const inputSlot = templateClone.querySelector("slot[name='input']");
    const categorySelectSlot = templateClone.querySelector(
      "slot[name='category-select']"
    );
    const addButtonSlot = templateClone.querySelector(
      "slot[name='add-button']"
    );
    const linkCardSlot = templateClone.querySelector("slot[name='link-card']");

    const linkInput = document.createElement("input");
    linkInput.type = "text";
    linkInput.id = "linkInput";
    linkInput.placeholder = "Enter URL";
    const title = document.createElement("h2");
    title.innerText = "Manage Your Links";
    const description = document.createElement("p");
    description.innerText = "Save, Edit, Share and Delete your links here.";

    const categorySelect = document.createElement("select");
    categorySelect.id = "categoryInput";
    categorySelect.innerHTML = `
        <option value="">Select Category</option>
        <option value="Work">Work</option>
        <option value="Personal">Personal</option>
        <option value="Fun">Fun</option>
        <option value="Food">Food</option>
        <option value="Others">Others</option>
      `;

    const addButton = document.createElement("button");
    addButton.id = "addLink";
    addButton.textContent = "Add +";

    titleSlot.appendChild(title);
    descriptionSlot.appendChild(description);
    inputSlot.appendChild(linkInput);
    categorySelectSlot.appendChild(categorySelect);
    addButtonSlot.appendChild(addButton);

    this.shadowRoot.appendChild(templateClone);

    this.linkData = this.shadowRoot.getElementById("linkInput");
    this.categoryData = this.shadowRoot.getElementById("categoryInput");
    this.addLinkButton = this.shadowRoot.getElementById("addLink");
    this.listLinks = this.shadowRoot.getElementById("listLinks");
    this.errorMessage = this.shadowRoot.getElementById("errorMessage");

    this.loadLinks();

    this.addLinkButton.addEventListener("click", () => this.addLink());
  }

  loadLinks() {
    const linksStorage = JSON.parse(localStorage.getItem("links") || "[]");

    // Group links by category
    const groupedLinks = linksStorage.reduce((acc, linkObj) => {
      if (!acc[linkObj.category]) {
        acc[linkObj.category] = [];
      }
      acc[linkObj.category].push(linkObj);
      return acc;
    }, {});

    this.listLinks.innerHTML = ""; // Clear previous content

    for (const category in groupedLinks) {
      const categoryCard = document.createElement("div");
      categoryCard.classList.add("category-card");

      const categoryTitle = document.createElement("div");
      categoryTitle.classList.add("category-title");
      categoryTitle.textContent = category;

      categoryCard.appendChild(categoryTitle);

      groupedLinks[category].forEach((linkObj, index) => {
        const linkItem = document.createElement("div");
        linkItem.classList.add("link-item");

        const linkText = document.createElement("span");
        linkText.textContent = linkObj.link;

        const containerBtn = document.createElement("div");
        containerBtn.classList.add("container-Btn");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.classList.add("edit-button");
        editButton.addEventListener("click", () => this.editLink(index));

        const shareButton = document.createElement("button");
        shareButton.textContent = "Share";
        shareButton.classList.add("share-button");
        shareButton.addEventListener("click", () =>
          this.shareLink(linkObj.link)
        );

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("delete-button");
        deleteButton.addEventListener("click", () => this.deleteLink(index));

        linkItem.appendChild(linkText);
        containerBtn.appendChild(editButton);
        containerBtn.appendChild(shareButton);
        containerBtn.appendChild(deleteButton);
        linkItem.appendChild(containerBtn);
        categoryCard.appendChild(linkItem);
      });

      this.listLinks.appendChild(categoryCard);
    }
  }

  addLink() {
    const newLink = this.linkData.value.trim();
    const selectedCategory = this.categoryData.value;

    if (!newLink || !selectedCategory) {
      this.errorMessage.style.display = "block"; // Show error message
      return;
    }

    this.errorMessage.style.display = "none"; // Hide error message if input is valid

    const linksStorage = JSON.parse(localStorage.getItem("links") || "[]");

    if (
      linksStorage.some(
        (linkObj) =>
          linkObj.link === newLink && linkObj.category === selectedCategory
      )
    ) {
      alert("URL already exists in this category!");
      return;
    }

    linksStorage.push({ link: newLink, category: selectedCategory });
    localStorage.setItem("links", JSON.stringify(linksStorage));

    this.linkData.value = "";
    this.categoryData.value = "";
    this.loadLinks();
  }

  editLink(index) {
    const linksStorage = JSON.parse(localStorage.getItem("links") || "[]");
    const currentLinkObj = linksStorage[index];

    const newLink = prompt("Edit Link", currentLinkObj.link);
    const newCategory = prompt("Edit Category", currentLinkObj.category);

    if (
      newLink &&
      newCategory &&
      (newLink !== currentLinkObj.link ||
        newCategory !== currentLinkObj.category)
    ) {
      linksStorage[index] = {
        link: newLink.trim(),
        category: newCategory.trim(),
      };
      localStorage.setItem("links", JSON.stringify(linksStorage));
      this.loadLinks();
    }
  }

  deleteLink(index) {
    const linksStorage = JSON.parse(localStorage.getItem("links") || "[]");

    if (confirm("Are you sure you want to delete this link?")) {
      linksStorage.splice(index, 1);
      localStorage.setItem("links", JSON.stringify(linksStorage));
      this.loadLinks();
    }
  }

  async shareLink(link) {
    if (navigator.share) {
      await navigator
        .share({
          title: "Check out this link!",
          url: link,
        })
        .then(() => {
          console.log("Link shared successfully!");
        })
        .catch((error) => {
          console.log("Error sharing the link:", error);
        });
    } else {
      alert("Web Share API is not supported on this device.");
    }
  }
}

customElements.define("link-list", LinkList);
